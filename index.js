'use strict';

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const exphbs = require('express-handlebars');
const express = require('express');
const path = require('path');
const session = require('express-session');
const query = require('querystring');

const api = require('./src/api');
const app = express();
const login = require('./src/routes/login');
const oauth = require('./src/oauth')('sqlite');

oauth.renewRefreshToken = true;

app.set('oauth', oauth);

app.engine('.hbs', exphbs({ extname: '.hbs', defaultLayout: 'main' }));
app.set('view engine', '.hbs');

app.use(session({
    secret: 'test',
    resave: false,
    saveUninitialized: false
}));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(oauth.inject());

function isUserAuthorized(req, res, next) {
    const params = req.query;

    oauth.model.client.fetchById(params.client_id, (err, client) => {
        if (client) {
            params.redirect_uri = client.redirectUri;
            if (req.session.authorized) next();
            else {
                params.backUrl = path.join(req.baseUrl, req.path);
                res.redirect(`/oauth/login?${query.stringify(params)}`);
            }
        }
    });
}

app.get('/oauth/authorization', isUserAuthorized, oauth.controller.authorization, (req, res) => {
    res.render('authorise');
});
app.post('/oauth/authorization', isUserAuthorized, oauth.controller.authorization);
app.post('/oauth/token', oauth.controller.token);
app.use('/oauth/login', login);

app.use('/api', oauth.middleware.bearer, api);

app.listen(3000);
