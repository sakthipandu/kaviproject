const express = require('express');
const controller = require('./controller')
const router = express.Router();

// routers...
router.post('/createdb',controller.createTable);
router.post('/adminlogin',controller.login);
router.post('/addvalue',controller.createValues);
router.get('/getdata',controller.getData);
router.put('/updatedata',controller.updateData);
router.delete('/deletedata',controller.deleteData);
router.get('/getprentlist',controller.getprentlist)


module.exports = router;