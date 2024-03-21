const Pool = require('pg').Pool;

const pool = new Pool({
    user: 'postgres',
    password: 'sa2547',
    port: 5432, 
    host: 'localhost',
    database: 'kv_metaldbase',
  });
  
  module.exports = pool;






























// const getColumns = async (req, res) => {
//   const master_name = req.body.master_name;
//   const { prefixedDatabaseName } = req.body;
//   try {
//     await pool.connect();
//     const clientDatabase = await databaseConnection(prefixedDatabaseName);

//     const tableExistsResult = await clientDatabase.query('SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1);', [master_name]);
//     const tableExists = tableExistsResult.rows[0].exists;

//     if (tableExists) {
//       const columnsResult = await clientDatabase.query('SELECT column_name FROM information_schema.columns WHERE table_name = $1;', [master_name]);
//       const fields = columnsResult.rows.map(row => row.column_name);

//       res.status(200).json({ fields });
    

//     } else {
//       res.status(404).json({ error: 'Table does not exist' });
//     }
//   } catch (error) {
//     res.status(500).json({ error: 'Internal server error: ' + error.message });
//   }
// };

// const createValues = async (request, response) => {
//   const { prefixedDatabaseName, master_name, field_values } = request.body;
//   let clientDatabase;
//   try {
//     await pool.connect();
//     clientDatabase = await databaseConnection(prefixedDatabaseName);

//     if (field_values && field_values.length > 0) {
//       for (const valueObj of field_values) {
//         const fields = Object.keys(valueObj).join(', ');
//         const values = Object.values(valueObj).map(val => `'${val}'`).join(', ');

//         // Insert into the master table
//         const insertMasterQuery = `INSERT INTO ${master_name} (${fields}) VALUES (${values}) RETURNING *`;
//         const masterResult = await clientDatabase.query(insertMasterQuery);
//         const masterId = masterResult.rows[0].master_id; // Assuming master_id is auto-generated

//         // If there are child tables
//         for (const field of valueObj.fields) {
//           if (field.field_type === 'child') {
//             const childTableName = field.parent_name;
//             const childFields = ['name', 'vol_id'].join(', ');
//             const childValues = [`'${valueObj[field.field_name]}'`, masterId].join(', ');

//             // Insert into the child table
//             const insertChildQuery = `INSERT INTO ${childTableName} (${childFields}) VALUES (${childValues})`;
//             await clientDatabase.query(insertChildQuery);
//           }
//         }
//       }
//     }
//     response.status(200).json({ message: 'Data inserted successfully' });
//   } catch (error) {
//     console.error('Error:', error.message);
//     response.status(500).json({ error: 'Internal server error' });
//   }
// };









