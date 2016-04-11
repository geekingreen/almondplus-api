'use strict';

const express = require('express');

const almond = require('./almond');
const app = express.Router();

app.get('/switches', (req, res) => {
    almond.sendAction({
        deviceName: req.query.device_name || req.body.device_name,
        action: req.query.action || req.body.action
    }).then(data => res.json(data),
        err => res.status(404).json(err));
});

module.exports = app;
