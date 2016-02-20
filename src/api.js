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
        if ((token.expires * 1000) - moment().unix() > 0) {
            next();
        } else {
            res.json({ message: 'Access token expired' });
        }
    });
};

app.use(verifyAccessToken);

app.put('/switches', (req, res) => {
    almond.sendAction({ cmd: 'setdeviceindex', devid: 1, index: 1, value: true }).then(data => res.json(data));
});

module.exports = app;
