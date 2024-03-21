const bcrypt = require('bcrypt');
const generator = require('generate-password');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const jwtSecret = 'your_secret_key_here';

const pool = require('../db');


// Create database... 
const createTable = async (request, response) => {
  request.body.masters.push({
    "master_name": "users",
    "fields": [
      { "field_name": "user_name", "field_type": "text" },
      { "field_name": "user_password", "field_type": "text" },
      { "field_name": "user_type", "field_type": "text", "options": ["admin", "user"] }
    ]
  })
  const { username, company_name, address, email_id, phone_no, website, gst_number, masters } = request.body;

  const password = generator.generate({ length: 10, numbers: true, uppercase: true, strict: true });

  console.log(password);

  try { 
    const hashedPassword = await bcrypt.hash(password, 10);
    const employeeInsertQuery =
      'INSERT INTO default_setting (username, company_name, address, email_id, phone_no, password, website, gst_number, info) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
    await pool.query(employeeInsertQuery, [username, company_name, address, email_id, phone_no, password, website, gst_number, JSON.stringify(request.body)]);

    let createTableQuery;

    for (const master of masters) {
      const { master_name, fields } = master;
      let fieldDefinitions = '';
      let primaryKeyAdded = false;

      for (const [i, field] of fields.entries()) {
        let { field_name, field_type } = field;
        if (field_type.toLowerCase() === 'increment') {
          fieldDefinitions += `"${master_name}" serial `;
          if (!primaryKeyAdded) {
            fieldDefinitions += 'primary key ';
            primaryKeyAdded = true;
          }
        } else if (field_type.toLowerCase() === 'text' || field_type.toLowerCase() === 'options') {
          fieldDefinitions += `"${field_name}" varchar(250)`;
        } else if (field_type.toLowerCase() === 'child') {
          fieldDefinitions += `"${field_name}" int `;
        }
        if (i === fields.length - 1) {
          fieldDefinitions += ''
        } else {
          fieldDefinitions += ','
        }
      }

      for (const field of fields) {
        if (field.field_type.toLowerCase() === 'child') {
          fieldDefinitions += `, FOREIGN KEY ("${field.field_name}") REFERENCES "${field.parent_name}"("${field.parent_name}_id")`;
        }
      }

      createTableQuery = `CREATE TABLE IF NOT EXISTS "${master_name}" ("${master_name}_id" serial primary key, ${fieldDefinitions})`;

      console.log('Table:', createTableQuery);
      await pool.query(createTableQuery);
    }


    await pool.query(`
    INSERT INTO "users" (user_name, user_password, user_type)
    VALUES ( $1, $2,'admin')`,
      [username, hashedPassword]);

      await sendOTPEmail(email_id, password, username, response);

  }
  catch (error) {
    console.error('Error:', error);
    response.status(500).json({ error: 'Internal server error' });
  }

}
async function sendOTPEmail(email, password, username, response) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: 'sakthi032vel@gmail.com',
      pass: 'ttjzpkoyqhgdzond',
    },
  });
  const mailOptions = {
    from: 'sakthi032vel@gmail.com',
    to: email,
    subject: 'Your Password',
    html: `<h1><font style="font-family: 'arial'">Your Password...</font></h1>
          <p><font color="black" size="3" style="font-family: 'arial'">HI ${username}.Your password. <strong>${password}</strong>..</font></p>`
  };
  try {
    await transporter.sendMail(mailOptions);
    response.status(200).json({ message: 'Your Organisation Datas Feed Successfully!...', UserName: 'admin', password: password});
  }
  catch (error) {
    console.error('Error:', error);
    response.status(500).json({ error: 'Internal server error' });
  }
};

//login...
const login = async (request, response) => {
  const { user_name, password } = request.body;
  try {

    const result = await pool.query('SELECT * FROM users WHERE user_name = $1', [user_name]);

    if (result.rows.length > 0) {
      const storedPassword = result.rows[0].user_password;
      const passwordMatch = await bcrypt.compare(password, storedPassword);

      if (passwordMatch) {
        const infoResult = await pool.query('SELECT info FROM default_setting');
        const info = infoResult.rows[0]?.info || {};
        console.log('Info:', info);
        response.json({ success: true, message: 'Login successful', info});
        console.log({ success: true, message: 'Login successful' });
      } else {
        response.status(401).json({ success: false, message: 'Invalid password' });
        console.log({ success: false, message: 'Invalid password' });
      }
    } else {
      response.status(401).json({ success: false, message: 'Invalid username' });
      console.log({ success: false, message: 'Invalid username' });
    }
  } catch (error) {
    console.error('Error executing query', error);
    response.status(500).json({ success: false, message: 'Internal server error' });
  }
};

//addvalues...
// const createValues = async (request, response) => {
//   const { master_name, field_value } = request.body;

//   try {
//     if (!master_name || !field_value || field_value.length === 0) {
//       return response.status(400).json({ error: 'Invalid request data' });
//     }

//     const fieldList = Object.keys(field_value[0]).join(', ');
//     const valuesList = field_value.map(valueObj =>
//       Object.values(valueObj).map(val => `'${val}'`).join(', ')
//     );

//     await pool.query(`INSERT INTO ${master_name} (${fieldList}) VALUES (${valuesList.join('), (')})`);
//     console.log('SQL Insert Query:', valuesList);

//     response.status(200).json({ message: 'Table data inserted successfully' });
//   } catch (error) {
//     console.error('Error:', error.message);
//     response.status(500).json({ error: 'Internal server error' });
//   }
// }

const createValues = async (request, response) => {
  const { master_name, fields } = request.body;

  try {
    if (!master_name || !fields || fields.length === 0) {
      return response.status(400).json({ error: 'Invalid request data' });
    }

    const fieldList = fields.map(field => field.field_name).join(', ');
    const valuesList = fields.map(field => {
      if (field.field_type === 'text') {
        return `'${field.field_value}'`;
      }
    }).join(', ');

    await pool.query(`INSERT INTO ${master_name} (${fieldList}) VALUES (${valuesList})`);
    console.log('SQL Insert Query:', `INSERT INTO ${master_name} (${fieldList}) VALUES (${valuesList})`);

    response.status(200).json({ message: 'Table data inserted successfully' });
  } catch (error) {
    console.error('Error:', error.message);
    response.status(500).json({ error: 'Internal server error' });
  }
}

//getdata...
const getData = async (request, response) => {
  const {  master_name } = request.body;
  try {
    const { rows } = await pool.query(`SELECT * FROM ${master_name}`);
    response.status(200).json({ data: rows });
  } catch (error) {
    console.error('Error:', error.message);
    response.status(500).json({ error: 'Failed to get data' });
  }
};

const getprentlist = async (request, response) => {

    const { master_name } = request.body;
  
    try {
      if (!master_name) {
        return response.status(400).json({ error: 'Invalid request data' });
      }
  
      const parentResult = await pool.query(`SELECT * FROM ${master_name} WHERE field_type = 'child'`);
      const parentRecords = parentResult.rows;
  
      if (!parentRecords || parentRecords.length === 0) {
        return response.status(404).json({ message: 'No parent records found' });
      }

      const parentNames = parentRecords.map(record => record.parent_name);
  
      const childResult = await pool.query(`SELECT * FROM ${master_name} WHERE field_name IN (${parentNames.map(name => `'${name}'`).join(', ')})`);
      const childRecords = childResult.rows;
  
      response.status(200).json(childRecords);
    } catch (error) {
      console.error('Error:', error.message);
      response.status(500).json({ error: 'Failed to get data' });
    }
  };

//updatedata...
const updateData = async (request, response) => {
  const { master_name, updated_values, id } = request.body;
  try {
    const updateValues = Object.entries(updated_values)
      .map(([key, value]) => `"${key}" = '${value}'`)
      .join(', ');
    const query = `UPDATE ${master_name} SET ${updateValues} WHERE ${master_name}_id = $1`;
    await pool.query(query, [id]);
    response.status(200).json({ message: 'Data updated successfully' });
  } catch (error) {
    console.error('Error:', error.message);
    response.status(500).json({ error: 'Failed to update data' });
  }
};

//deletedata...
const deleteData = async (request, response) => {
  const { master_name, id } = request.body;
  try {
    const query = `DELETE FROM ${master_name} WHERE ${master_name}_id = ${id}`;
    await pool.query(query);
    response.status(200).json({ message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Error:', error.message);
    throw new Error('Failed to delete data');
  }
};

//modules...
module.exports = {
  createTable,
  createValues,
  login,
  getData,
  updateData,
  deleteData,
  getprentlist
}
