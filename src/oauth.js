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

app.oauth = oauthServer({
    model: require('./model'),
    grants: ['auth_code', 'password'],
    debug: true
});

app.all('/oauth/token', app.oauth.grant());

app.get('/oauth/authorise', function (req, res, next) {
    if (!req.session.user) {
        // If they aren't logged in, send them to your own login implementation
        return res.redirect('/oauth/login?redirect=' + req.path + '&client_id=' +
            req.query.client_id + '&redirect_uri=' + req.query.redirect_uri);
    }

    res.render('authorise', {
        client_id: req.query.client_id,
        redirect_uri: req.query.redirect_uri,
        state: req.query.state
    });
});

app.post('/oauth/authorise', function (req, res, next) {
    if (!req.session.user) {
        return res.redirect('/oauth/login?client_id=' + req.body.client_id +
            '&redirect_uri=' + req.body.redirect_uri +
            '&state=' + req.body.state);
    }
    next();
}, app.oauth.authCodeGrant(function (req, next) {
    // The first param should to indicate an error
    // The second param should a bool to indicate if the user did authorise the app
    // The third param should for the user/uid (only used for passing to saveAuthCode)
    next(null, req.body.allow === 'yes', req.session.user.id, req.session.user);
}));

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
            return res.redirect((req.body.redirect || '/oauth/authorise') + '?client_id=' +
                req.body.client_id + '&redirect_uri=' + req.body.redirect_uri +
                '&state=' + req.body.state);
        }
    });
});
app.get('/', app.oauth.authorise(), (req, res) => {
    res.send('Secret area');
});

app.use(app.oauth.errorHandler());

module.exports = app;
