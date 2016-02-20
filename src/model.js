'use strict';
const db = require('./db');

module.exports = {
    getAuthCode(authCode, cb) {
        db.getAuthCode(authCode, cb);
    },

    saveAuthCode(authCode, clientId, expires, user, cb) {
        db.saveAuthCode(authCode, clientId, expires, user, cb);
    },

    getAccessToken(bearerToken, cb) {
        db.getAccessToken(bearerToken, cb);
    },

    saveAccessToken(accessToken, clientId, expires, user, cb) {
        db.saveAccessToken(accessToken, clientId, expires, user, cb);
    },

    getClient(clientId, clientSecret, cb) {
        db.getClient(clientId, cb);
    },

    grantTypeAllowed(clientId, grantType, cb) {
        cb(null, (grantType === 'password' || grantType === 'auth_code'));
    },

    getUser(username, password, cb) {
        db.getUser(username, password, cb);
    }
};
