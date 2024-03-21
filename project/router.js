const express = require('express');
const controller = require('./controller')
const router = express.Router();

// routers...
router.post('/createdb',controller.createTable);
router.post('/adminlogin',controller.login);
router.post('/addvalue',controller.createValues);
router.get('/getdata/:master_name',controller.getData);
router.put('/updatedata',controller.updateData);
router.delete('/deletedata/:master_name/:id',controller.deleteData);
router.get('/getprentlist',controller.getprentlist)
router.get('/getbyid',controller.getById);


module.exports = router;