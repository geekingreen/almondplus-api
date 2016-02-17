'use strict';
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./oauth.db');

const FIELD_ID = 'rowid';

const TABLE_DBINFO = 'dbinfo';
const FIELD_DBINFO_VERSION = 'version';

const TABLE_CLIENTS = 'oauth_clients';
const FIELD_CLIENTS_ID = 'client_id';
const FIELD_CLIENTS_SECRET = 'secret';
const FIELD_CLIENTS_NAME = 'name';

const TABLE_USERS = 'users';
const FIELD_USERS_USERNAME = 'username';
const FIELD_USERS_PASSWORD = 'password';

const TABLE_TOKENS = 'auth_tokens';
const FIELD_TOKEN = 'auth_token';
const FIELD_TOKENS_CLIENT_ID = 'client_id';
const FIELD_TOKENS_USER_ID = 'user_id';
const FIELD_TOKENS_EXPIRE = 'expires';

const SQL_CREATE_DBINFO = `
    CREATE TABLE IF NOT EXISTS ${TABLE_DBINFO}
    (${FIELD_ID}, ${FIELD_DBINFO_VERSION} TEXT)
`;
const SQL_CREATE_CLIENTS = `
    CREATE TABLE IF NOT EXISTS ${TABLE_CLIENTS}
    (${FIELD_ID}, ${FIELD_CLIENTS_ID} TEXT, ${FIELD_CLIENTS_SECRET} TEXT, ${FIELD_CLIENTS_NAME} TEXT)
`;
const SQL_CREATE_USERS = `
    CREATE TABLE IF NOT EXISTS ${TABLE_USERS}
    (${FIELD_ID}, ${FIELD_USERS_USERNAME} TEXT UNIQUE, ${FIELD_USERS_PASSWORD} TEXT)
`;
const SQL_CREATE_TOKENS = `
    CREATE TABLE IF NOT EXISTS ${TABLE_TOKENS}
    (${FIELD_ID}, ${FIELD_TOKEN} TEXT, ${FIELD_TOKENS_CLIENT_ID} TEXT, ${FIELD_TOKENS_USER_ID} INTEGER, ${FIELD_TOKENS_EXPIRE} TEXT)
`;
const SQL_INSERT_DBINFO = `
    INSERT OR REPLACE INTO ${TABLE_DBINFO}
    (${FIELD_ID}, ${FIELD_DBINFO_VERSION})
    VALUES
    (?, ?)
`;
const SQL_INSERT_USER = `
    INSERT OR IGNORE INTO ${TABLE_USERS}
    (${FIELD_USERS_USERNAME}, ${FIELD_USERS_PASSWORD})
    VALUES
    (?, ?)
`;
const SQL_UPDATE_USER = `
    UPDATE ${TABLE_USERS}
    SET
    ${FIELD_USERS_PASSWORD} = ?
    WHERE
    ${FIELD_USERS_USERNAME} = ?
`;

const SQL_GET_USER = `
    SELECT ${FIELD_ID} AS id FROM ${TABLE_USERS}
    WHERE ${FIELD_USERS_USERNAME} = ? AND ${FIELD_USERS_PASSWORD} = ?
`;

const SQL_GET_TOKEN = `
    SELECT ${FIELD_TOKENS_EXPIRE}, ${FIELD_TOKENS_USER_ID} AS userId
    FROM ${TABLE_TOKENS} WHERE ${FIELD_TOKEN} = ?
`;

const SQL_SAVE_TOKEN = `
    INSERT INTO ${TABLE_TOKENS}
    VALUES (?, ?, ?, ?)
`;

class Store {
    constructor(db) {
        this.db = db;
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
}

module.exports = function (config) {
    db.serialize(function() {
        db.run(SQL_CREATE_DBINFO);
        db.run(SQL_CREATE_CLIENTS);
        db.run(SQL_CREATE_USERS);
        db.run(SQL_CREATE_TOKENS);
        db.run(SQL_INSERT_DBINFO, 1, 1);
        if (config.users) {
            config.users.forEach((user, i) => {
                const username = user.username;
                const password = user.password;
                db.run(SQL_INSERT_USER, username, password);
                db.run(SQL_UPDATE_USER, password, username);
            });
        }
    });
    return new Store(db);
};