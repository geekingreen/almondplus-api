'use strict';
const fs = require('fs');
const sqlite3 = require('sqlite3');

if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
}

const db = new sqlite3.Database('./data/oauth.db');
const config = require('../config');

const FIELD_ID = 'rowid';

const TABLE_DBINFO = 'dbinfo';
const FIELD_DBINFO_VERSION = 'version';

const TABLE_CLIENTS = 'oauth_clients';
const FIELD_CLIENTS_ID = 'client_id';
const FIELD_CLIENTS_SECRET = 'secret';
const FIELD_CLIENTS_NAME = 'name';
const FIELD_CLIENTS_REDIRECT = 'redirect_uri';

const TABLE_USERS = 'users';
const FIELD_USERS_USERNAME = 'username';
const FIELD_USERS_PASSWORD = 'password';

const TABLE_TOKENS = 'auth_tokens';
const FIELD_TOKEN = 'auth_token';
const FIELD_TOKENS_CLIENT_ID = 'client_id';
const FIELD_TOKENS_USER_ID = 'user_id';
const FIELD_TOKENS_EXPIRE = 'expires';

const TABLE_AUTHCODE = 'auth_codes';
const FIELD_AUTHCODE = 'code';
const FIELD_AUTHCODE_CLIENT_ID = 'client_id';
const FIELD_AUTHCODE_USER_ID = 'user_id';
const FIELD_AUTHCODE_EXPIRE = 'expires';

const SQL_CREATE_DBINFO = `
    CREATE TABLE IF NOT EXISTS ${TABLE_DBINFO}
    (${FIELD_DBINFO_VERSION} TEXT)
`;

const SQL_CREATE_CLIENTS = `
    CREATE TABLE IF NOT EXISTS ${TABLE_CLIENTS}
    (${FIELD_CLIENTS_ID} TEXT, ${FIELD_CLIENTS_SECRET} TEXT, ${FIELD_CLIENTS_NAME} TEXT UNIQUE, ${FIELD_CLIENTS_REDIRECT})
`;

const SQL_CREATE_USERS = `
    CREATE TABLE IF NOT EXISTS ${TABLE_USERS}
    (${FIELD_USERS_USERNAME} TEXT UNIQUE, ${FIELD_USERS_PASSWORD} TEXT)
`;

const SQL_CREATE_TOKENS = `
    CREATE TABLE IF NOT EXISTS ${TABLE_TOKENS}
    (${FIELD_TOKEN} TEXT, ${FIELD_TOKENS_CLIENT_ID} TEXT, ${FIELD_TOKENS_USER_ID} INTEGER, ${FIELD_TOKENS_EXPIRE} TEXT)
`;

const SQL_CREATE_AUTHCODES = `
    CREATE TABLE IF NOT EXISTS ${TABLE_AUTHCODE}
    (${FIELD_AUTHCODE} TEXT, ${FIELD_AUTHCODE_CLIENT_ID} TEXT, ${FIELD_AUTHCODE_USER_ID} INTEGER, ${FIELD_AUTHCODE_EXPIRE} TEXT)
`;

const SQL_INSERT_DBINFO = `
    INSERT OR REPLACE INTO ${TABLE_DBINFO}
    (${FIELD_ID}, ${FIELD_DBINFO_VERSION})
    VALUES (?, ?)
`;

const SQL_INSERT_CLIENT = `
    INSERT OR IGNORE INTO ${TABLE_CLIENTS}
    (${FIELD_CLIENTS_ID}, ${FIELD_CLIENTS_SECRET}, ${FIELD_CLIENTS_NAME}, ${FIELD_CLIENTS_REDIRECT})
    VALUES (?, ?, ?, ?)
`;

const SQL_UPDATE_CLIENT = `
    UPDATE ${TABLE_CLIENTS}
    SET
    ${FIELD_CLIENTS_ID} = ?,
    ${FIELD_CLIENTS_SECRET} = ?,
    ${FIELD_CLIENTS_REDIRECT} = ?
    WHERE ${FIELD_CLIENTS_NAME} = ?
`;

const SQL_INSERT_USER = `
    INSERT OR IGNORE INTO ${TABLE_USERS}
    (${FIELD_USERS_USERNAME}, ${FIELD_USERS_PASSWORD})
    VALUES (?, ?)
`;

const SQL_UPDATE_USER = `
    UPDATE ${TABLE_USERS}
    SET
    ${FIELD_USERS_PASSWORD} = ?
    WHERE
    ${FIELD_USERS_USERNAME} = ?
`;

const SQL_GET_CLIENT = `
    SELECT
    ${FIELD_CLIENTS_ID} as clientId,
    ${FIELD_CLIENTS_NAME} as name,
    ${FIELD_CLIENTS_SECRET} as clientSecret,
    ${FIELD_CLIENTS_REDIRECT} as redirectUri
    FROM ${TABLE_CLIENTS}
    WHERE ${FIELD_CLIENTS_ID} = ?
`;

const SQL_GET_USER = `
    SELECT ${FIELD_ID} AS id, ${FIELD_USERS_USERNAME} FROM ${TABLE_USERS}
    WHERE ${FIELD_USERS_USERNAME} = ? AND ${FIELD_USERS_PASSWORD} = ?
`;

const SQL_GET_TOKEN = `
    SELECT
        ${FIELD_TOKENS_EXPIRE},
        ${FIELD_TOKENS_USER_ID} AS userId,
        ${FIELD_TOKENS_CLIENT_ID} AS clientId
    FROM ${TABLE_TOKENS} WHERE ${FIELD_TOKEN} = ?
`;

const SQL_SAVE_TOKEN = `
    INSERT INTO ${TABLE_TOKENS}
    VALUES (?, ?, ?, ?)
`;

const SQL_GET_AUTHCODE = `
    SELECT
        ${FIELD_AUTHCODE_EXPIRE},
        ${FIELD_AUTHCODE_USER_ID} AS userId,
        ${FIELD_AUTHCODE_CLIENT_ID} AS clientId
    FROM ${TABLE_AUTHCODE}
    WHERE ${FIELD_AUTHCODE} = ?
`;

const SQL_SAVE_AUTHCODE = `
    INSERT INTO ${TABLE_AUTHCODE}
    VALUES (?, ?, ?, ?)
`;

db.serialize(function() {
    db.run(SQL_CREATE_DBINFO);
    db.run(SQL_CREATE_CLIENTS);
    db.run(SQL_CREATE_USERS);
    db.run(SQL_CREATE_TOKENS);
    db.run(SQL_CREATE_AUTHCODES);
    db.run(SQL_INSERT_DBINFO, 1, 1);
    if (config.users) {
        config.users.forEach((user) => {
            const username = user.username;
            const password = user.password;
            db.run(SQL_INSERT_USER, username, password);
            db.run(SQL_UPDATE_USER, password, username);
        });
    }
    if (config.clients) {
        config.clients.forEach(client => {
            const clientId = client.clientId;
            const clientSecret = client.clientSecret;
            const name = client.name;
            const redirectUri = client.redirectUri;
            db.run(SQL_INSERT_CLIENT, clientId, clientSecret, name, redirectUri);
            db.run(SQL_UPDATE_CLIENT, clientId, clientSecret, redirectUri, name);
        });
    }
});

class Store {
    constructor(db) {
        this.db = db;
    }

    getAuthCode(authCode, cb) {
        this.db.get(SQL_GET_AUTHCODE, authCode, cb);
    }

    saveAuthCode(authCode, clientId, expires, user, cb) {
        const stmt = this.db.prepare(SQL_SAVE_AUTHCODE);
        stmt.run(authCode, clientId, user.id, expires);
        stmt.finalize(cb);
    }

    getAccessToken(bearerToken, cb) {
        this.db.get(SQL_GET_TOKEN, bearerToken, cb);
    }

    saveAccessToken(accessToken, clientId, expires, user, cb) {
        const stmt = this.db.prepare(SQL_SAVE_TOKEN);
        stmt.run(accessToken, clientId, user.id, expires);
        stmt.finalize(cb);
    }

    getUser(username, password, cb) {
        this.db.get(SQL_GET_USER, username, password, cb);
    }

    getClient(clientId, cb) {
        this.db.get(SQL_GET_CLIENT, clientId, cb);
    }
}

module.exports = new Store(db);
