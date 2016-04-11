'use strict';

const express = require('express');
const query = require('querystring');

const app = express.Router();
const model = require('../oauth/model/sqlite');

app.get('/', (req, res) => {
    res.render('login');
});

app.post('/', (req, res, next) => {
    const params = req.query;
    var backUrl = params.backUrl || '/';
    delete(params.backUrl);
    backUrl += backUrl.indexOf('?') > -1 ? '&' : '?';
    backUrl += query.stringify(params);

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
