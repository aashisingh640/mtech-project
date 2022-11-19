const express = require('express');
const router = express.Router();

const multipart = require('connect-multiparty');
const multipartMiddleware = multipart({ uploadDir: './temp' });

const userController = require('./../controllers/userController');
const invoiceController = require('../controllers/invoiceController');

router.route('/authenticate').post(userController.authenticate);
router.post('/upload', multipartMiddleware, invoiceController.uploadPDF);
router.post('/uploadZip', multipartMiddleware, invoiceController.uploadZip);
router.get('/invoices', invoiceController.getAllInvoices);
router.get('/chart', invoiceController.getChartData);
router.get('/related', invoiceController.getRelatedData);
router.get('/filedata', invoiceController.getFileData);
router.post('/save', invoiceController.saveInvoice);

module.exports = router;