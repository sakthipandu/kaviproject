const express = require('express');
const controller = require('./desktop')
const user = require('./users');
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
router.get('/gst/:productId',controller.getproducts);
router.post('/invoice',controller.createinvoice)

router.post('/usersingup',user.userSingup);
router.post('/otpverify',user.veriFyOTP);
router.post('/userlogin', user.userLogin);


module.exports = router;