const fs = require('fs');
const PDFParser = require('pdf2json');
const path = require('path');
const moment = require('moment');
const jsforce = require('jsforce');
const request = require('request');
const formidable = require('formidable');
const admZip = require('adm-zip');
async = require('async');

function uploadPDF(req, res) {
    try {

        const token = req.headers['x-access-token'];
        const instanceUrl = req.headers['x-instance-url'];

        if (!token || !instanceUrl) {
            return res.status(401).json({ msg: 'Access Token or Instance url is missing' });
        }

        fs.readdir('./temp', (err, files) => {

            if (err) {
                return res.status(500).json({ error });
            }

            if (files.length === 0) {
                return res.status(500).json({ error: 'No file found' });
            }

            const fileName = files[0];
            const filePath = path.join('./temp', fileName);

            const pdfParser = new PDFParser(null, 1);
            pdfParser.loadPDF(filePath);

            pdfParser.on("pdfParser_dataError", errData => {
                console.error(errData.parserError);
                return res.status(500).json({ error: errData.parserError });
            });

            pdfParser.on("pdfParser_dataReady", async pdfData => {
                try {

                    const data = await pdfParser.getRawTextContent();
                    console.log(data);

                    const { invoice, lineItems } = extractData(data);

                    if (typeof invoice === 'string') {
                        return res.status(500).json({ error: invoice });
                    }

                    const connection = await makeConnection(token, instanceUrl);
                    const { result, id } = await createInvoice(invoice, lineItems, connection);

                    fs.readFile(filePath, (async (err, fileData) => {

                        if (err) {
                            console.log(err);
                        }

                        await uploadAttachment(id, fileName, fileData, connection);

                        fs.unlink(filePath, err => console.log(err));

                        return res.json({
                            success: true,
                            fileName: fileName,
                            msg: result
                        });

                    }));

                } catch (error) {
                    console.log(error);
                    fs.exists(filePath, exists => {
                        exists && fs.unlink(filePath, err => console.log(err));
                    })
                    return res.status(500).json({ error });
                }

            });

        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: error.message });
    }
}

function uploadZip(req, res) {
    try {

        const token = req.headers['x-access-token'];
        const instanceUrl = req.headers['x-instance-url'];

        if (!token || !instanceUrl) {
            return res.status(401).json({ msg: 'Access Token or Instance url is missing' });
        }

        fs.readdir('./temp', async (err, files) => {

            if (err) {
                return res.status(500).json({ msg: error.message });
            }

            if (files.length === 0) {
                return res.status(500).json({ msg: 'No file found' });
            }

            const fileName = files[0];
            const filePath = path.join('./temp', fileName);

            const zip = new admZip(filePath);
            const zipEntries = zip.getEntries();
            const fileNames = [];

            zipEntries.forEach(entry => {
                console.log('name ---', entry.name, entry);
                if (entry.name && !entry.name.startsWith('._')) {
                    fileNames.push(entry.name);
                    zip.extractEntryTo(entry, './temp', false, true);
                } 
            })

            await readFiles(fileNames, token, instanceUrl);
            deleteFile(filePath);

            return res.json({ msg: `${fileNames.length} Invoices created successfully.` })

        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: error.message });
    }
}

function readFiles(fileNames, token, instanceUrl) {
    return new Promise((resolve, reject) => {

        async.eachLimit(fileNames, 1, function (file, callback) {

            const filePath = path.join('./temp', file);

            fs.readFile(filePath, (err, fileData) => {
                if (err) {
                    deleteFile(filePath);
                } else {

                    const pdfParser = new PDFParser(null, 1);
                    pdfParser.loadPDF(filePath);
            
                    pdfParser.on("pdfParser_dataError", errData => {
                        console.error(errData.parserError);
                        return res.status(500).json({ msg: errData.parserError });
                    });
            
                    pdfParser.on("pdfParser_dataReady", async pdfData => {
                        try {
            
                            const data = await pdfParser.getRawTextContent();
                            console.log(data);
            
                            const { invoice, lineItems } = extractData(data);
            
                            if (typeof invoice === 'string') {
                                return res.status(500).json({ msg: invoice });
                            }
            
                            const connection = await makeConnection(token, instanceUrl);
                            const { result, id } = await createInvoice(invoice, lineItems, connection);
            
                            fs.readFile(filePath, (async (err, fileData) => {
            
                                if (err) {
                                    console.log(err);
                                }
            
                                await uploadAttachment(id, file, fileData, connection);
            
                                fs.unlink(filePath, err => console.log(err));
                                return callback();
            
                            }));
            
                        } catch (error) {
                            console.log(error);
                            deleteFile(filePath);
                            return callback();
                        }
            
                    });

                }
            })
        }, err => {
            if (err) {
                reject(err);
            } else {                    
                resolve();
            }
        })


    })
}

function deleteFile(filePath) {
    fs.exists(filePath, exists => {
        exists && fs.unlink(filePath, err => console.log(err));
    })
}

async function getAllInvoices(req, res) {
    try {

        const token = req.headers['x-access-token'];
        const instanceUrl = req.headers['x-instance-url'];

        if (!token || !instanceUrl) {
            return res.status(401).json({ msg: 'Access Token or Instance url is missing' });
        }

        const userId = req.query.userId;

        const connection = await makeConnection(token, instanceUrl);
        const metadata = await getMetadata(connection, 'Invoice__c');

        const fields = metadata.fields;

        const fieldNames = metadata.fields.map(field => {
            return field.type === 'reference' ? `${field.name}, ${field.relationshipName}.Name` : field.name;
        })

        const records = await getRecords(connection, 'Invoice__c', fieldNames.toString(), `Buyer__c = '${userId}'`);

        return res.json({ records, fields })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
}

async function getChartData(req, res) {
    try {

        const token = req.headers['x-access-token'];
        const instanceUrl = req.headers['x-instance-url'];

        if (!token || !instanceUrl) {
            return res.status(401).json({ msg: 'Access Token or Instance url is missing' });
        }

        const query = `Select count(Id), ${req.query.groupBy} from Invoice__c group by ${req.query.groupBy}`;

        const connection = await makeConnection(token, instanceUrl);
        const data = await connection.query(query);

        return res.json({ data })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
}

async function getRelatedData(req, res) {
    try {

        const token = req.headers['x-access-token'];
        const instanceUrl = req.headers['x-instance-url'];

        if (!token || !instanceUrl) {
            return res.status(401).json({ msg: 'Access Token or Instance url is missing' });
        }

        const connection = await makeConnection(token, instanceUrl);

        const invId = req.query.invId;

        const metadata = await getMetadata(connection, 'Invoice_Line_Item__c');
        const fields = metadata.fields;

        const fieldNames = metadata.fields.map(field => {
            return field.type === 'reference' ? `${field.name}, ${field.relationshipName}.Name` : field.name;
        })

        const records = await getRecords(connection, 'Invoice_Line_Item__c', fieldNames.toString(), `Invoice__c = '${invId}'`);
        const cdRecords = await getRecords(connection, 'ContentDocumentLink', 'Id, LinkedEntityId, ContentDocumentId', `LinkedEntityId = '${invId}'`);

        const docId = cdRecords.length > 0 ? cdRecords[0].ContentDocumentId : '';

        const attachments = docId ? await getRecords(connection, 'ContentVersion', 'Id, ContentDocumentId, Title, ContentSize, VersionData, Description, FileType, LastModifiedDate, FileExtension', `ContentDocumentId = '${docId}'`) : [];

        return res.json({ records, fields, attachments })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
}

function extractData(data) {
    try {

        const keyMap = {
            'Company': 'Company__c',
            'Address': 'Comapny_Address__c',
            'Invoice No': 'Invoice_Number__c',
            'Invoice Date': 'Invoice_Date__c',
            'DESCRIPTION': 'Product_Description__c',
            'SERVICE NO': 'Product_Service_No__c',
            'QUANTITY': 'Quantity__c',
            'RATE': 'Rate__c',
            'TOTAL': 'Amount__c',
            'SUBTOTAL': 'Amount__c',
            'DISCOUNT': 'Discount__c',
            'TAX RATE': 'Tax_Rate__c',
            'TOTAL TAX': 'Total_Tax__c',
            'SHIPPING': 'Shipping__c',
            'TOTAL AMOUNT': 'Total_Amount__c',
            'Buyer Email': 'Buyer__c'
        }

        const invoice = {};
        const lineItems = [];
        let lineNumber = 1;

        const numberFields = ['Amount__c', 'Discount__c', 'Total_Tax__c', 'Shipping__c', 'Total_Amount__c'];
        const percentFields = ['Tax_Rate__c'];
        const dateFields = ['Invoice_Date__c'];

        const arrayList = data.split('\n');

        arrayList.forEach(list => {

            if (list.includes(':')) {

                const key = list.split(':')[0];
                let value = list.split(':')[1];

                if (key && value) {
                    const field = keyMap[key];

                    if (field) {

                        value = value.trim().split('\r')[0];

                        if (value.includes(',')) {
                            value = value.split(',')[0]
                        }

                        if (numberFields.includes(field)) {
                            value = Number(value);
                        }

                        if (percentFields.includes(field)) {
                            value = Number(value.split('%')[0]);
                        }

                        if (dateFields.includes(field)) {
                            value = moment(value).format('YYYY-MM-DD');
                        }

                        invoice[field] = value;
                    }
                }

            } else if (list.includes(',') && !list.includes('DESCRIPTION')) {
                const values = list.split(',');

                values.forEach(value => {
                    if (value) value = value.trim();
                })

                const lineItem = {
                    Product_Description__c: values[0],
                    Product_Service_No__c: values[1],
                    Quantity__c: Number(values[2]),
                    Rate__c: Number(values[3]),
                    Amount__c: Number(values[4]),
                    Line_Number__c: lineNumber
                }

                lineItems.push(lineItem);
                lineNumber++;
            }
        })

        invoice.Current_State__c = 'Ready For Validation';
        invoice.Invoice_Type__c = lineItems.length > 0 ? 'Non PO Invoice' : 'PO Invoice';

        console.log(invoice);
        console.log(lineItems);

        return { invoice, lineItems };

    } catch (error) {
        console.log(error);
        return error.message;
    }
}

function createInvoice(invoice, lineItems, connection) {

    return new Promise(async (resolve, reject) => {
        try {


            const buyer = await getRecords(connection, 'User', 'Id, Name', `Email = '${invoice.Buyer__c}'`);
            if (buyer.length > 0) {
                invoice.Buyer__c = buyer[0].Id;
            } else {
                delete invoice.Buyer__c;
            }

            const comment = [{
                "name": buyer[0].Name,
                "modifiedDate": moment(new Date()),
                "comment": `Invoice extracted by OCR and created in the system as invoice number: ${invoice.Invoice_Number__c}, with total amount: ${new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3 }).format(invoice.Total_Amount__c)} and ${lineItems.length} line items.`
            }];
    
            invoice.Comment_History__c = JSON.stringify(comment);
            
            const invResult = await connection.sobject('Invoice__c').create(invoice);

            console.log(invResult);

            if (!invResult.success) {
                reject(invResult.errors[0]);
            }

            lineItems.forEach(line => line.Invoice__c = invResult.id)

            const lineResult = await connection.sobject('Invoice_Line_Item__c').create(lineItems);

            const result = `Invoice Number: ${invoice.Invoice_Number__c} created successfully!`;
            resolve({ result, id: invResult.id });

        } catch (error) {
            console.log(error);
            reject(error);
        }

    })
}

function uploadAttachment(invoiceId, fileName, fileData, connection) {

    return new Promise(async (resolve, reject) => {
        try {

            const cvObj = {
                PathOnClient: fileName,
                VersionData: new Buffer(fileData).toString('base64'),
                Description: `Invoice Uploaded`,
                Title: fileName
            };

            const cvResult = await connection.sobject('ContentVersion').create(cvObj);
            const result = await connection.sobject('ContentVersion').select('Id, ContentDocumentId').where(`Id = '${cvResult.id}'`);
            
            const cdlObj = {
                LinkedEntityId: invoiceId,
                ContentDocumentId: result[0].ContentDocumentId,
                ShareType: 'V',
                Visibility: 'AllUsers'
            };
            
            const cdlResult = await connection.sobject('ContentDocumentLink').create(cdlObj);
            resolve();

        } catch (error) {
            console.log(error);
            reject(error);
        }

    })
}

function getMetadata(connection, sobject) {

    return new Promise(async (resolve, reject) => {
        try {

            const metadata = await connection.sobject(sobject).describe();
            resolve(metadata);

        } catch (error) {
            console.log(error);
            reject(error);
        }

    })
}

function getRecords(connection, sobject, fields, whereClause) {

    return new Promise(async (resolve, reject) => {
        try {

            const records = await connection.sobject(sobject).select(fields).where(whereClause);
            resolve(records);

        } catch (error) {
            console.log(error);
            reject(error);
        }

    })
}

async function getFileData(req, res) {

    try {

        const token = req.headers['x-access-token'];
        const instanceUrl = req.headers['x-instance-url'];

        if (!token || !instanceUrl) {
            return res.status(401).json({ msg: 'Access Token or Instance url is missing' });
        }

        const connection = await makeConnection(token, instanceUrl);

        const { id, name } = req.query;
        const bodyURL = `/services/data/v${connection.version}/sobjects/ContentVersion/${id}/VersionData`;
    
        const config = {
            method: 'GET',
            uri: connection.instanceUrl + bodyURL,
            headers: {
                "Authorization": "Bearer " + connection.accessToken
            }
        };

        const stream = request(config).pipe(fs.createWriteStream(`./temp/${name}`, { autoClose: true }));
        stream.on('finish', () => {
            fs.createReadStream(stream.path, { bufferSize: 64 * 1024 }).pipe(res);
            setTimeout(() => {
                fs.exists(path.join('./temp', name), exists => {
                    if (exists) {
                        fs.unlink(path.join('./temp', name), err => {
                           console.log(err);
                        });
                    }
                })            
            }, 500);
        });

    } catch (error) {
        console.log(error);
        return res.json({ error });
    }

}

async function saveInvoice(req, res) {

    try {

        const token = req.headers['x-access-token'];
        const instanceUrl = req.headers['x-instance-url'];

        if (!token || !instanceUrl) {
            return res.status(401).json({ msg: 'Access Token or Instance url is missing' });
        }

        const connection = await makeConnection(token, instanceUrl);
        const data = req.body;
        console.log(data);

        const history = data.Comment_History__c;

        if (history && data.Comments__c) {
            data.Comment_History__c = await formatComments(connection, history, data.Comments__c, data.userId);
            data.Comments__c = '';
        }
        
        delete data.userId;

        const response = await connection.sobject('Invoice__c').update(data);
        console.log(response);

        return res.json({ msg: 'Invoice Updated', response })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }

}

function formatComments(connection, history, comment, userId) {

    return new Promise(async (resolve, reject) => {

        try {
            
            history = JSON.parse(history);

            const buyer = await getRecords(connection, 'User', 'Id, Name', `Id = '${userId}'`);
    
            history.push({
                "name": buyer[0].Name,
                "modifiedDate": moment(new Date()),
                "comment": comment
            })
    
            resolve(JSON.stringify(history));
    
        } catch (error) {
            console.log(error);
            resolve(history);
        }
    })

}

function makeConnection(token, instanceUrl) {

    return new Promise(async (resolve, reject) => {
        try {

            const connection = new jsforce.Connection({
                accessToken: token,
                instanceUrl
            });
            resolve(connection);

        } catch (err) {
            console.log('error in makeConnection - ', err)
            reject(err);
        }
    })

}

module.exports = { uploadPDF, uploadZip, getAllInvoices, getChartData, getRelatedData, getFileData, saveInvoice }