'use strict';
const db = require('./db')(require('./config'));

module.exports = {
    getAccessToken(bearerToken, cb) {
        db.getAccessToken(bearerToken, cb);
    },

    getClient(clientId, clientSecret, cb) {
        cb(null, { clientId: 'test' });
    },

    grantTypeAllowed(clientId, grantType, cb) {
        cb(null, grantType === 'password');
    },

    saveAccessToken(accessToken, clientId, expires, user, cb) {
        db.saveAccessToken(accessToken, clientId, expires, user, cb);
    },

    getUser(username, password, cb) {
        db.getUser(username, password, cb);
    }
};
