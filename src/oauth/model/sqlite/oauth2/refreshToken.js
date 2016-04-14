'use strict';

const crypto = require('crypto');

const db = require('../db');

const TABLE = 'refresh_tokens';
const FIELD_TOKEN = 'token';
const FIELD_CLIENT_ID = 'client_id';
const FIELD_USER_ID = 'user_id';
const FIELD_SCOPE = 'scope';

const SQL_CREATE_TABLE = `
    CREATE TABLE IF NOT EXISTS ${TABLE}
    (${FIELD_TOKEN} TEXT, ${FIELD_USER_ID} TEXT, ${FIELD_CLIENT_ID} TEXT, ${FIELD_SCOPE} TEXT)
`;

const SQL_INSERT = `
    INSERT INTO ${TABLE}
    VALUES (?, ?, ?, ?)
`;

const SQL_GET_BY_TOKEN = `
    SELECT
        ${FIELD_TOKEN},
        ${FIELD_USER_ID} as userId,
        ${FIELD_CLIENT_ID} as clientId,
        ${FIELD_SCOPE}
    FROM ${TABLE}
    WHERE ${FIELD_TOKEN} = ?
`;

const SQL_DELETE_BY_USER_ID_CLIENT_ID = `
    DELETE FROM ${TABLE}
    WHERE
        ${FIELD_USER_ID} = ?
    AND
        ${FIELD_CLIENT_ID} = ?
`;

const SQL_DELETE_BY_TOKEN = `
    DELETE FROM ${TABLE}
    WHERE
        ${FIELD_TOKEN} = ?
`;

db.serialize(() => {
    db.run(SQL_CREATE_TABLE);
});

module.exports = {
    getUserId: refreshToken => refreshToken.userId,

    getClientId: refreshToken => refreshToken.clientId,

    getScope: refreshToken => refreshToken.scope,

    fetchByToken: (token, cb) => {
        const stmt = db.prepare(SQL_GET_BY_TOKEN);
        stmt.run(token);
        stmt.finalize(cb);
    },

    removeByUserIdClientId: (userId, clientId, cb) => {
        const stmt = db.prepare(SQL_DELETE_BY_USER_ID_CLIENT_ID);
        stmt.run(userId, clientId);
        stmt.finalize(cb);
    },

    removeByRefreshToken: (token, cb) => {
        const stmt = db.prepare(SQL_DELETE_BY_TOKEN);
        stmt.run(token);
        stmt.finalize(cb);
    },

    create: (userId, clientId, scope, cb) => {
        const token = crypto.randomBytes(64).toString('hex');

        const stmt = db.prepare(SQL_INSERT);
        stmt.run(token, userId, clientId, scope);
        stmt.finalize((err) => err ? cb(err) : cb(null, token));
    }
};
