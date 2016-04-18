'use strict';

const express = require('express');

const almond = require('./almond');
const app = express.Router();

app.get('/switches', (req, res) => {
    res.json(almond.getDevices());
});

app.get('/switches/:applianceId/:action', (req, res) => {
    if (/on|off/.test(req.params.action)) {
        almond.sendAction({
            applianceId: req.params.applianceId,
            action: req.params.action
        }).then(data => {
            res.json({ success: true });
        }, res.status(500).json({ message: 'Invalid action' }));
    } else {
        res.status(500).json({ message: 'Invalid action' });
    }
});

module.exports = app;
