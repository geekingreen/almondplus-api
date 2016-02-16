'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const oauthserver = require('oauth2-server');
const Almond = require('./almond');

const almond = new Almond(require('./config'));
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.oauth = oauthserver({
    model: require('./model'),
    grants: ['password'],
    debug: true
});

app.all('/oauth/token', app.oauth.grant());
app.get('/', app.oauth.authorise(), function (req, res) {
    res.send('Secret area');
});

app.use(app.oauth.errorHandler());

app.listen(3000);

almond.on('message', data => {
    if (data.commandtype === 'devicelist') {
        const devices = data.data;
        Object.keys(devices).forEach(k => console.log(`Found Device: ${devices[k].devicename}`));
    }
});

almond.send({ mii: 1, cmd: 'devicelist' });
almond.send({ MobileInternalIndex: 1, CommandType: 'ClientList' });
