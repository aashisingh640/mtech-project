const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const express = require('express');
const path = require('path');
const bodyParser = require("body-parser");

const routes = require('./routes/route.js');

const app = express();

app.use(express.json());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use('/', express.static(path.join(__dirname, '/dist/ap-portal')));

app.use('/api', routes);

app.get('/', (req, res) => {
    return res.send('Welcome to AP Portal');
})

//Handle unknown routes
app.use((req, res) => {
    console.log('The request didn\'t match any endpoint - ', req.url);
    return res.status(404).send('404 – Not Found');
});

app.listen(process.env.PORT || 3000, () => {
    console.log('server is listening..');
})