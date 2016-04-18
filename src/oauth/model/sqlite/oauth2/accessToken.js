'use strict';

const crypto = require('crypto');
const db = require('../db');

const TABLE = 'access_tokens';
const FIELD_TOKEN = 'token';
const FIELD_CLIENT_ID = 'client_id';
const FIELD_USER_ID = 'user_id';
const FIELD_SCOPE = 'scope';
const FIELD_EXPIRE = 'expires';

const SQL_CREATE_TABLE = `
    CREATE TABLE IF NOT EXISTS ${TABLE}
    (${FIELD_TOKEN} TEXT, ${FIELD_CLIENT_ID} TEXT, ${FIELD_USER_ID} INTEGER, ${FIELD_SCOPE} TEXT, ${FIELD_EXPIRE} TEXT)
`;

const SQL_INSERT = `
    INSERT INTO ${TABLE}
    VALUES (?, ?, ?, ?, ?)
`;

const SQL_GET_BY_TOKEN = `
    SELECT
        ${FIELD_TOKEN},
        ${FIELD_CLIENT_ID} AS clientId,
        ${FIELD_USER_ID} AS userId,
        ${FIELD_SCOPE},
        ${FIELD_EXPIRE}
    FROM ${TABLE} WHERE ${FIELD_TOKEN} = ?
`;

const SQL_GET_BY_USER_ID_CLIENT_ID = `
    SELECT
        ${FIELD_TOKEN},
        ${FIELD_CLIENT_ID} AS clientId,
        ${FIELD_USER_ID} AS userId,
        ${FIELD_SCOPE},
        ${FIELD_EXPIRE}
    FROM ${TABLE}
    WHERE ${FIELD_USER_ID} = ? AND ${FIELD_CLIENT_ID} = ?
`;

db.serialize(() => {
    db.run(SQL_CREATE_TABLE);
});

module.exports = {
    getToken: accessToken => accessToken.token,

    create: (userId, clientId, scope, ttl, cb) => {
        const token = crypto.randomBytes(64).toString('hex');
        const expires = new Date().getTime() + ttl * 1000;

        const stmt = db.prepare(SQL_INSERT);
        stmt.run(token, clientId, userId, scope, expires);
        stmt.finalize((err) => err ? cb(err) : cb(null, token));
    },

    fetchByToken: (token, cb) => {
        db.get(SQL_GET_BY_TOKEN, token, cb);
    },

    fetchByUserIdClientId: (userId, clientId, cb) => {
        db.get(SQL_GET_BY_USER_ID_CLIENT_ID, userId, clientId, cb);
    },

    getTTL: accessToken => {
        const ttl = moment(accessToken.expires).diff(new Dat(), 'seconds');
        return cb(null, ttl > 0 ? ttl : 0);
    },

    checkTTL: accessToken => accessToken.expires > new Date().getTime(),

    ttl: 30 * 24 * 60 * 60 // days, hours, mins, secs
};
