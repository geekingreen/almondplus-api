'use strict';

const express = require('express');

const almond = require('./almond');
const app = express.Router();

app.get('/switches', (req, res) => {
    res.json(almond.getDevices());
});

module.exports = app;
