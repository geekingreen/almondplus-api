'use strict';
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./oauth.db');

db.serialize(function() {
    db.run('CREATE TABLE clients (client_id TEXT, client_secret TEXT, client_name TEXT)');
    db.run('CREATE TABLE users (username TEXT, password TEXT)');
    db.run('CREATE TABLE tokens (token_id TEXT, client_id TEXT, user_id TEXT, expires TEXT)');
    db.run('INSERT INTO users VALUES (?, ?)', 'geekingreen', 'test');
});

module.exports = {
    getAccessToken(bearerToken, cb) {
        db.get('SELECT expires, user_id AS userId FROM tokens WHERE token_id = ?', bearerToken, cb);
    },

    getClient(clientId, clientSecret, cb) {
        cb(null, { clientId: 'test' });
    },

    grantTypeAllowed(clientId, grantType, cb) {
        cb(null, grantType === 'password');
    },

    saveAccessToken(accessToken, clientId, expires, user, cb) {
        var s = db.prepare('INSERT INTO tokens VALUES (?, ?, ?, ?)');
        s.run(accessToken, clientId, user.id, expires);
        s.finalize(cb);
    },

    getUser(username, password, cb) {
        db.get('SELECT rowid AS id FROM users WHERE username = ? AND password = ?', username, password, cb);
    }
};
