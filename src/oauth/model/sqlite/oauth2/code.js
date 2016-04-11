'use strict';

const crypto = require('crypto');
const db = require('../db');

const TABLE = 'codes';
const FIELD_CODE = 'code';
const FIELD_CLIENT_ID = 'client_id';
const FIELD_USER_ID = 'user_id';
const FIELD_SCOPE = 'scope';
const FIELD_EXPIRE = 'expires';

const SQL_CREATE_TABLE = `
    CREATE TABLE IF NOT EXISTS ${TABLE}
    (${FIELD_CODE} TEXT, ${FIELD_USER_ID} INTEGER, ${FIELD_CLIENT_ID} TEXT, ${FIELD_SCOPE} TEXT, ${FIELD_EXPIRE} TEXT)
`;

const SQL_INSERT = `
    INSERT INTO ${TABLE}
    VALUES (?, ?, ?, ?, ?)
`;

const SQL_GET_BY_CODE = `
    SELECT
        ${FIELD_CODE},
        ${FIELD_CLIENT_ID} AS clientId,
        ${FIELD_USER_ID} AS userId,
        ${FIELD_SCOPE},
        ${FIELD_EXPIRE}
    FROM ${TABLE}
    WHERE ${FIELD_CODE} = ?
`;

const SQL_REMOVE_BY_CODE = `
    DELETE FROM ${TABLE}
    WHERE ${FIELD_CODE} = ?
`;

db.serialize(() => {
    db.run(SQL_CREATE_TABLE);
});

module.exports = {
    create: (userId, clientId, scope, ttl, cb) => {
        const code = crypto.randomBytes(32).toString('hex');
        const expires = new Date().getTime() + ttl * 1000;

        const stmt = db.prepare(SQL_INSERT);
        stmt.run(code, userId, clientId, scope, expires);
        stmt.finalize(cb);
    },

    fetchByCode: (code, cb) => {
        db.run(SQL_GET_BY_CODE, code, cb);
    },

    getUserId: code => code.userId,

    getClientId: code => code.clientId,

    getScope: code => code.scope,

    checkTTL: code => code.expires > new Date().getTime(),

    removeByCode: (code, cb) => {
        db.run(SQL_REMOVE_BY_CODE, code, cb);
    }
};
