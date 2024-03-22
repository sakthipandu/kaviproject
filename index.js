const express = require('express');
const bodyParser = require('body-parser');
const dataRouter = require('./conroller/router');
require('dotenv').config();
const cors = require('cors')

const app = express();
const port = 5000;

app.use(cors()); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(dataRouter);

app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'http://192.168.1.43:8080');      
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.get('/', (request, response) => {
  response.json({ message: 'Hello World' });
  console.log({ message: 'Hello World' });
});

app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`);
});
