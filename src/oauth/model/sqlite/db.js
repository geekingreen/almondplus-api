'use strict';

const fs = require('fs');
const sqlite3 = require('sqlite3');

const cwd = process.cwd();

const DIR_DATA = `${cwd}/data`;

if (!fs.existsSync(DIR_DATA)) {
    fs.mkdirSync(DIR_DATA);
}

const db = new sqlite3.Database(`${DIR_DATA}/oauth.db`);

module.exports = db;
