'use strict';
const moment = require('moment');
const express = require('express');
const almond = require('./almond');
const db = require('./db');

const app = express.Router();

const verifyAccessToken = (req, res, next) => {
    const accessToken = req.query.auth_token;
    db.getAccessToken(accessToken, (err, token) => {
        if (err || !token) {
            return res.json({ message: 'Invalid token' });
        }
        if (parseInt(token.expires, 10) - moment().valueOf() > 0) {
            next();
        } else {
            res.json({ message: 'Access token expired' });
        }
    });
};

app.use(verifyAccessToken);

app.put('/switches', (req, res) => {
    almond.sendAction({
        deviceName: req.query.device_name || req.body.device_name,
        action: req.query.action || req.body.action
    }).then(data => res.json(data));
});

module.exports = app;
