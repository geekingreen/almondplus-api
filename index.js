'use strict';
const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const oauthserver = require('oauth2-server');
const config = require('./config');
const db = require('./db')(config);
const Almond = require('./almond');

const almond = new Almond(config);
const app = express();

app.engine('.hbs', exphbs({ extname: '.hbs', defaultLayout: 'main' }));
app.set('view engine', '.hbs');

app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.oauth = oauthserver({
    model: require('./model')(db),
    grants: ['password'],
    debug: true
});

app.all('/oauth/token', app.oauth.grant());

app.get('/oauth/authorise', function (req, res, next) {
    if (!req.session.user) {
        // If they aren't logged in, send them to your own login implementation
        return res.redirect('/login?redirect=' + req.path + '&client_id=' +
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
        return res.redirect('/login?client_id=' + req.query.client_id +
            '&redirect_uri=' + req.query.redirect_uri +
            '&state=' + req.query.state);
    }
    next();
}, app.oauth.authCodeGrant(function (req, next) {
    // The first param should to indicate an error
    // The second param should a bool to indicate if the user did authorise the app
    // The third param should for the user/uid (only used for passing to saveAuthCode)
    next(null, req.body.allow === 'yes', req.session.user.id, req.session.user);
}));

app.get('/login', (req, res) => {
    res.render('login', {
        redirect: req.query.redirect,
        client_id: req.query.client_id,
        redirect_uri: req.query.redirect_uri,
        state: req.query.state
    });
});
app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    db.getUser(username, password, (err, user) => {
        console.log(err, user);
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

app.listen(3000);



almond.on('message', res => {
    if (res.commandtype === 'devicelist') {
        const devices = res.data;
        Object.keys(devices).forEach(k => console.log(`Found Device: ${devices[k].devicename}`));
    }
});

almond.send({ mii: 1, cmd: 'devicelist' });
almond.send({ MobileInternalIndex: 1, CommandType: 'ClientList' });
