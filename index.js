'use strict';
const express = require('express');
const exphbs = require('express-handlebars');
const oauth = require('./src/oauth');
const api = require('./src/api');
const almond = require('./src/almond');

const app = express();

app.engine('.hbs', exphbs({ extname: '.hbs', defaultLayout: 'main' }));
app.set('view engine', '.hbs');

app.use('/oauth', oauth);
app.use('/api', api);

app.listen(3000);

almond.on('message', res => {
    if (res.commandtype === 'devicelist') {
        const devices = res.data;
        Object.keys(devices).forEach(k => console.log(`Found Device: ${devices[k].devicename}`));
    }
});

almond.send({ mii: 1, cmd: 'devicelist' });
almond.send({ MobileInternalIndex: 1, CommandType: 'ClientList' });
