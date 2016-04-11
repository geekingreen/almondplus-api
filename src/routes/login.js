'use strict';

const express = require('express');
const query = require('querystring');
const path = require('path');

const app = express.Router();
const model = require('../oauth/model/sqlite');

app.get('/', (req, res) => {
    res.render('login', { path: path.join(req.baseUrl, req.path) });
});

app.post('/', (req, res, next) => {
    const backUrl = req.query.backUrl || '/';
    delete(req.query.backUrl);
    backUrl += backUrl.indexOf('?') > -1 ? '&' : '?';
    backUrl += query.stringify(req.query);

    if (req.session.authorized) res.redirect(backUrl);
    else if (req.body.username && req.body.password) {
        model.oauth2.user.fetchByUsername(req.body.username, (err, user) => {
            if (err || !user) next(err);
            else {
                model.oauth2.user.checkPassword(user, req.body.password, (err, valid) => {
                    if (err) next(err);
                    else if (!valid) res.redirect(req.url);
                    else {
                        req.session.user = user;
                        req.session.authorized = true;
                        res.redirect(backUrl);
                    }
                });
            }
        });
    }
    else res.redirect(req.url);
});

module.exports = app;
