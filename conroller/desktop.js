
const bcrypt = require('bcrypt');
const generator = require('generate-password');
const nodemailer = require('nodemailer');

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
  },
    {
      "master_name": "invoices",
      "fields": [
        { "field_name": "customer_name", "field_type": "text" },
        { "field_name": "total_amount", "field_type": "numeric" },
      ]
    });

  const { username, company_name, address, email_id, phone_no, website, gst_number, masters } = request.body;

  const password = generator.generate({ length: 10, numbers: true, uppercase: true, strict: true });

  console.log(password);

  try {
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'default_setting''usersingup'
      )`;

    const tableExistsResult = await pool.query(checkTableQuery);

    if (!tableExistsResult.rows[0].exists) {
      const createtableQuery = `
        CREATE TABLE IF NOT EXISTS default_setting ( id SERIAL, username VARCHAR(250) NULL, company_name VARCHAR(250), address VARCHAR(250),  email_id VARCHAR(250) NULL, phone_no BIGINT NULL, password VARCHAR(250), website VARCHAR(250), gst_number INTEGER, info JSON )`;
      await pool.query(createtableQuery);
    } if (!tableExistsResult.rows[0].exists) {
      const userloginQuery =
        `CREATE TABLE IF NOT EXISTS usersingup (id SERIAL, name VARCHAR(250) NULL, email_id VARCHAR(250) NULL, phone_no BIGINT NULL, password VARCHAR(250) NULL, verificationCode INTEGER)`;
      await pool.query(userloginQuery);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const checkUserQuery = 'SELECT * FROM default_setting WHERE email_id = $1';
    const userCheckResult = await pool.query(checkUserQuery, [email_id]);

    if (userCheckResult.rows.length > 0) {
      return response.status(400).json({ error: 'email_id already exists' });
    }

    await pool.query('INSERT INTO default_setting (username, company_name, address, email_id, phone_no, password, website, gst_number, info) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [username, company_name, address, email_id, phone_no, hashedPassword, website, gst_number, JSON.stringify(request.body)]);


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
        } else if (field_type.toLowerCase() === 'text' || field_type.toLowerCase() === 'select' || field_type.toLowerCase() === 'email' || field_type.toLowerCase() === 'password') {
          fieldDefinitions += `"${field_name}" varchar(250)`;
        } else if (field_type.toLowerCase() === 'child' || field_type.toLowerCase() === 'integer') {
          fieldDefinitions += `"${field_name}" int `;
        } else if (field_type.toLowerCase() === 'number') {
          fieldDefinitions += `"${field_name}" bigint `;
        } else if (field_type.toLowerCase() === 'json') {
          fieldDefinitions += `"${field_name}" json `;
        } else if (field_type.toLowerCase() === 'numeric') {
          fieldDefinitions += `"${field_name}" numeric `;
        }
        if (i === fields.length - 1) {
          fieldDefinitions += ''
        } else {
          fieldDefinitions += ','
        }
      }

      let foreignKeyConstraints = '';
      for (const field of fields) {
        if (field.field_type.toLowerCase() === 'child') {
          const parentName = field.parent_name;
          foreignKeyConstraints += `, FOREIGN KEY ("${field.field_name}") REFERENCES "${parentName}"("${parentName}_id")`;
        }
      }

      createTableQuery = `CREATE TABLE IF NOT EXISTS "${master_name}" ("${master_name}_id" serial primary key, ${fieldDefinitions}${foreignKeyConstraints})`;

      console.log('Table:', createTableQuery);
      await pool.query(createTableQuery);
    }

    await pool.query(`
    INSERT INTO "users" (user_name, user_password, user_type)
    VALUES ( $1, $2, 'admin')`,
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
    tls: {
      rejectUnauthorized: false // Ignore SSL certificate verification
    }
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
    response.status(200).json({ message: 'Your Organisation Datas Feed Successfully!...', UserName: username, password: password });
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
    const userResult = await pool.query('SELECT * FROM users WHERE user_name = $1', [user_name]);

    if (userResult.rows.length > 0) {
      const storedPassword = userResult.rows[0].user_password;
      const passwordMatch = await bcrypt.compare(password, storedPassword);

      if (passwordMatch) {
        const infoResult = await pool.query('SELECT * FROM default_setting WHERE username = $1', [user_name]);
        const info = infoResult.rows[0]?.info || {};
        console.log('Info:', info);
        response.json({ success: true, message: 'Login successful', info });
        console.log({ success: true, message: 'Login successful' });
      } else {
        response.status(401).json({ success: false, message: 'Invalid credentials' });
        console.log({ success: false, message: 'Invalid password' });
      }
    } else {
      response.status(401).json({ success: false, message: 'Invalid credentials' });
      console.log({ success: false, message: 'Invalid username' });
    }
  } catch (error) {
    console.error('Error executing query:', error);
    response.status(500).json({ success: false, message: 'Internal server error' });
  }
};

//createvalue...
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
      } else if (field.field_type === 'child') {
        return parseInt(field.field_value) || 'NULL';
      } else {
        return 'NULL';
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
  const master_name = request.params.master_name;
  try {
    const { rows } = await pool.query(`SELECT * FROM ${master_name}`);
    response.status(200).json({ field: rows });
  } catch (error) {
    console.error('Error:', error.message);
    response.status(500).json({ error: 'Failed to get data' });
  }
};

//getbyid
const getById = async (request, response) => {
  const { master_name, id } = request.body;
  try {
    const { rows } = await pool.query(`SELECT * FROM ${master_name} WHERE ${master_name}_id = $1`, [id]);
    response.status(200).json({ field: rows });
  } catch (error) {
    console.error('Error:', error.message);
    response.status(500).json({ error: 'Failed to get data' });
  }
};

//updatedata...
const updateData = async (request, response) => {
  const { master_name, fields, id } = request.body;
  try {
    const updateValues = Object.entries(fields)
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
  const { master_name, id } = request.params;
  try {
    const query = `DELETE FROM ${master_name} WHERE ${master_name}_id = ${id}`;
    await pool.query(query);
    response.status(200).json({ message: 'Data deleted successfully' });
    console.log('Data deleted successfully');
  } catch (error) {
    console.error('Error deleting data:', error.message);
    response.status(500).json({ message: 'Failed to delete data' });
  }
};

//getparent...
const getprentlist = async (request, response) => {
  const fields = request.body;
  try {
    if (!Array.isArray(fields)) {
      return response.status(400).json({ error: 'Invalid request data: fields is not an array' });
    }
    const getFieldParentNames = (fields) => {
      const parentNames = fields
        .filter(field => field && field.field_type === 'child')
        .map(field => field && field.parent_name);
      return [...new Set(parentNames)].filter(name => name);
    };

    const parentList = getFieldParentNames(fields);

    const parentLists = [];
    for (const parentName of parentList) {
      const parentListQuery = `SELECT * FROM ${parentName}`;
      const { rows } = await pool.query(parentListQuery);
      parentLists.push({ [parentName]: rows });
    }
    response.status(200).json({ parentLists });
  } catch (error) {
    console.error('Error:', error.message);
    response.status(500).json({ error: 'Failed to get data' });
  }
};

//gsr and discount...
function calculateGST(product_price) {
  const GST_RATE = 0.18;
  return product_price * GST_RATE;
}

//get gst ...
const getproducts = async (request, responce) => {
  const productId = request.params.productId;
  try {
    const result = await pool.query('SELECT product_price FROM product WHERE product_id = $1', [productId]);
    if (result.rows.length === 0) {
      return responce.status(404).json({ message: 'Product not found' });
    }
    const price = result.rows[0].product_price;
    const gstAmount = calculateGST(price);
    return responce.json({ gstAmount });
  } catch (error) {
    console.error('Error executing query', error);
    return responce.status(500).json({ message: 'Internal server error' });
  }
};

//add invoice...
const createinvoice = async (request, response) => {
  const { customerName, productId, discount } = request.body;
  try {
    const productResult = await pool.query('SELECT product_price FROM product WHERE product_id = $1', [productId]);
    if (productResult.rows.length === 0) {
      return response.status(404).json({ message: 'Product not found' });
    }
    const price = parseFloat(productResult.rows[0].product_price);
    const gstAmount = parseFloat(calculateGST(price));
    const totalAmount = price + gstAmount - discount;

    const invoiceResult = await pool.query('INSERT INTO invoices (customer_name, total_amount) VALUES ($1, $2) RETURNING invoices_id', [customerName, totalAmount]);
    const invoiceId = invoiceResult.rows[0].id;
    return response.json({ invoiceId, totalAmount });
  } catch (error) {
    console.error('Error executing query', error);
    return response.status(500).json({ message: 'Internal server error' });
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
  getprentlist,
  getById,
  getproducts,
  createinvoice,
}
