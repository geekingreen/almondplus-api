'use strict';

module.exports = function (db) {
    return {
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
            cb(null, grantType === 'password');
        },

        getUser(username, password, cb) {
            db.getUser(username, password, cb);
        }
    };
};
