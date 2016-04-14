'use strict';

const db = require('../db');

const TABLE = 'clients';
const FIELD_CLIENT_ID = 'client_id';
const FIELD_SECRET = 'secret';
const FIELD_NAME = 'name';
const FIELD_REDIRECT = 'redirect_uri';

const SQL_CREATE_TABLE = `
    CREATE TABLE IF NOT EXISTS ${TABLE}
    (${FIELD_NAME} TEXT UNIQUE, ${FIELD_CLIENT_ID} TEXT, ${FIELD_SECRET} TEXT, ${FIELD_REDIRECT})
`;

const SQL_INSERT = `
    INSERT OR IGNORE INTO ${TABLE}
    (${FIELD_NAME}, ${FIELD_CLIENT_ID}, ${FIELD_SECRET}, ${FIELD_REDIRECT})
    VALUES (?, ?, ?, ?)
`;

const SQL_GET_BY_ID = `
    SELECT
    ${FIELD_CLIENT_ID} as clientId,
    ${FIELD_NAME},
    ${FIELD_SECRET},
    ${FIELD_REDIRECT} as redirectUri
    FROM ${TABLE}
    WHERE ${FIELD_CLIENT_ID} = ?
`;

const SQL_UPDATE_BY_NAME = `
    UPDATE ${TABLE}
    SET
    ${FIELD_CLIENT_ID} as clientId = ?,
    ${FIELD_SECRET} = ?,
    ${FIELD_REDIRECT} as redirectUri = ?
    WHERE ${FIELD_NAME} = ?
`;

db.serialize(() => {
    db.run(SQL_CREATE_TABLE);
});

module.exports = {
    getId: client => client.clientId,

    getRedirectUri: client => client.redirectUri,

    checkRedirectUri: (client, redirectUri) => {
        return (redirectUri.indexOf(client.redirectUri) === 0 &&
            redirectUri.replace(client.redirectUri, '').indexOf('#') === -1);
    },

    fetchById: (clientId, cb) => {
        db.get(SQL_GET_BY_ID, clientId, cb);
    },

    checkSecret: (client, secret, cb) => {
        return cb(null, client.secret === secret);
    },

    create: (data, cb) => {
        if (!data.name || !data.clientId || !data.secret || !data.redirectUri) {
            throwError();
        }

        const stmt = db.prepare(SQL_INSERT);
        stmt.run(data.name, data.clientId, data.secret, data.redirectUri);
        stmt.finalize(cb);
    },

    updateByName: (name, data, cb) => {
        if (!name || !data.clientId || !data.secret || !data.redirectUri) {
            throwError();
        }

        const stmt = db.prepare(SQL_UPDATE_BY_NAME);
        stmt.run(data.clientId, data.secret, data.redirectUri, name);
        stmt.finalize(cb);
    }
};

function throwError() {
    throw new Error('These fields are required: clientId, name, secret, redirectUri.');
}
