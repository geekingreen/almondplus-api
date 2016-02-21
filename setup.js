'use strict';
const FILE = './config.json';

const shortid = require('shortid');
const jsonfile = require('jsonfile');
const jsonData = jsonfile.readFileSync(FILE);
const args = process.argv.slice(2);

switch(args[0]) {
case 'adduser':
    const username = args[1];
    const password = args[2];
    (jsonData.users = jsonData.users || [])
        .push({ username, password });
    break;
case 'addclient':
    const name = args[1];
    const redirectUri = args[2];
    const clientId = shortid.generate();
    const clientSecret = shortid.generate() + shortid.generate() + shortid.generate();
    (jsonData.clients = jsonData.clients || [])
        .push({ name, clientId, clientSecret, redirectUri });
    break;
}

jsonfile.writeFileSync(FILE, jsonData, { spaces: 4 });
