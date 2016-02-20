'use strict';
const express = require('express');
const exphbs = require('express-handlebars');
const oauth = require('./src/oauth');
const api = require('./src/api');

const app = express();

app.engine('.hbs', exphbs({ extname: '.hbs', defaultLayout: 'main' }));
app.set('view engine', '.hbs');

app.use('/oauth', oauth);
app.use('/api', api);

app.listen(3000);
