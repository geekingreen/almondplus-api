'use strict';

const db = require('../db');

const TABLE= 'users';
const FIELD_USERNAME = 'username';
const FIELD_PASSWORD = 'password';

const SQL_CREATE_TABLE = `
    CREATE TABLE IF NOT EXISTS ${TABLE}
    (${FIELD_USERNAME} TEXT UNIQUE, ${FIELD_PASSWORD} TEXT)
`;

const SQL_INSERT = `
    INSERT OR IGNORE INTO ${TABLE}
    (${FIELD_USERNAME}, ${FIELD_PASSWORD})
    VALUES (?, ?)
`;

const SQL_GET_BY_ID = `
    SELECT rowid as id, * FROM ${TABLE}
    WHERE id = ?
`;

const SQL_GET_BY_USERNAME = `
    SELECT rowid as id, * FROM ${TABLE}
    WHERE ${FIELD_USERNAME} = ?
`;

const SQL_UPDATE_PASSWORD_BY_USERNAME = `
    UPDATE ${TABLE}
    SET
        ${FIELD_PASSWORD} = ?
    WHERE
        ${FIELD_USERNAME} = ?
`;

const SQL_DELETE_BY_USERNAME = `
    DELETE FROM ${TABLE}
    WHERE
        ${FIELD_USERNAME} = ?
`;

db.serialize(() => {
    db.run(SQL_CREATE_TABLE);
});

module.exports = {
    getId: user => user.id,

    fetchById: (id, cb) => {
        db.get(SQL_GET_BY_ID, id, cb);
    },

    fetchByUsername: (username, cb) => {
        db.get(SQL_GET_BY_USERNAME, username, cb);
    },

    checkPassword: (user, password, cb) => {
        cb(null, user.password === password);
    },

    fetchFromRequest: req => req.session.user,

    create: (username, password, cb) => {
        const stmt = db.prepare(SQL_INSERT);
        stmt.run(username, password);
        stmt.finalize(cb);
    },

    updatePasswordByUsername: (password, username, cb) => {
        const stmt = db.prepare(SQL_UPDATE_PASSWORD_BY_USERNAME);
        stmt.run(password, username);
        stmt.finalize(cb);
    },

    deleteByUsername: (username, cb) => {
        const stmt = db.prepare(SQL_DELETE_BY_USERNAME);
        stmt.run(username);
        stmt.finalize(cb);
    }
};
