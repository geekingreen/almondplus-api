'use strict';
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const oauthServer = require('oauth2-server');
const db = require('./db');
const config = require('../config');

const app = express.Router();

app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/oauth/login', (req, res) => {
    if (req.query.client_id) {
        db.getClient(req.query.client_id, function (err, client) {
            res.render('login', {
                redirect: req.query.redirect,
                client_id: req.query.client_id,
                redirect_uri: req.query.redirect_uri || encodeURIComponent(client.redirectUri),
                state: req.query.state
            });
        });
    }
});

app.post('/oauth/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const client_id = req.body.client_id;
    db.getClient(client_id, (err, client) => {
        console.log(client);
    });
    db.getUser(username, password, (err, user) => {
        if(err || !user) {
            res.render('login', {
                redirect: req.body.redirect,
                client_id: req.body.client_id,
                redirect_uri: req.body.redirect_uri,
                state: req.body.state
            });
        } else {
            req.session.user = user;
            return res.redirect(req.body.redirect_uri + '#state=' + req.body.state + '&access_token=testtoken&token_type=Bearer');
        }
    });
});

app.get('/oauth', (req, res, next) => {
    const auth_token = req.query.auth_token;
    db.getAccessToken(auth_token, (err, token) => {
        console.log(token);
    });
}, (req, res) => {
    res.send('Secret area');
});

module.exports = app;
