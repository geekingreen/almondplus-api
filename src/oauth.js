'use strict';
const moment = require('moment');
const shortid = require('shortid');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const db = require('./db');
const config = require('../config');

const generateAccessToken = () => {
    return shortid.generate() + shortid.generate() + shortid.generate();
};


const app = express.Router();

app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/login', (req, res) => {
    if (req.query.client_id) {
        db.getClient(req.query.client_id, function (err, client) {
            req.session.client = client;
            res.render('login', {
                client_id: req.query.client_id,
                redirect_uri: req.query.redirect_uri || client.redirectUri,
                state: req.query.state
            });
        });
    } else {
        res.json({ message: 'invalid client_id' });
    }
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const client_id = req.body.client_id;
    if (client_id === req.session.client.clientId) {
        db.getUser(username, password, (err, user) => {
            if(err || !user) {
                res.render('login', {
                    client_id: req.body.client_id,
                    redirect_uri: req.body.redirect_uri,
                    state: req.body.state,
                    error: 'Unknown User'
                });
            } else {
                const access_token = generateAccessToken();
                db.saveAccessToken(access_token, client_id, moment().add(30, 'days').valueOf(), user, () => {
                    res.redirect(req.body.redirect_uri + '#state=' + req.body.state + '&access_token=' + access_token + '&token_type=Bearer');
                });
            }
        });
    } else {
        res.json({ message: 'invalid client_id' });
    }
});

module.exports = app;
