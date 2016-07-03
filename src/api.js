'use strict';

const express = require('express');

const almond = require('./almond');
const app = express.Router();

app.get('/switches', (req, res) => {
    res.json(almond.getDevices());
});

app.get('/switches/:applianceId/:index/:value', (req, res) => {
    const applianceId = req.params.applianceId;
    const index = req.params.index;
    const value = req.params.value;

    almond.sendAction({
        applianceId: applianceId,
        index: index,
        value: value
    }).then(data => {
        res.json({ success: true });
    }, res.status(500).json({ message: 'Invalid action' }));
});

module.exports = app;
