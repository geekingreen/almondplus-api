'use strict';

const crypto = require('crypto');
const inquirer = require('inquirer');

var model;

inquirer.prompt([
    {
        type: 'list',
        name: 'db',
        message: 'Which database would you like to use?',
        choices: [
            {
                name: 'SQLite 3',
                value: 'sqlite'
            }
        ]
    },
    {
        type: 'checkbox',
        name: 'todo',
        message: 'What would you like to setup?',
        choices: [
            {
                name: 'User',
                value: 'user'
            },
            {
                name: 'Client',
                value: 'client'
            }
        ]
    }
]).then(answers => {
    model = require(`./src/oauth/model/${answers.db}`);
    const todo = answers.todo;
    let questions = [];

    for (let i = 0; i < todo.length; i++) {
        switch(todo[i]) {
        case 'user':
            questions = questions.concat(getUserQuestions());
            break;
        case 'client':
            questions = questions.concat(getClientQuestions());
            break;
        }
    }

    inquirer.prompt(questions)
        .then(answers => {
            console.log(`Creating ${todo.join(' and ')}...`);

            const username = answers.username;
            const password = answers.password;
            const clientName = answers.clientName;
            const clientUri = answers.clientUri;

            if (username && password) {
                model.oauth2.user.create(username, password, err => {
                    if (err) throw new Error('Failed to create user!');
                    else {
                        console.log(`User ${username} created.`);
                    }
                });
            }

            if (clientName && clientUri) {
                const clientId = crypto.randomBytes(32).toString('hex');
                const secret = crypto.randomBytes(64).toString('hex');

                model.oauth2.client.create({ name: clientName, clientId, secret, redirectUri: clientUri }, err => {
                    if (err) throw new Error('Failed to create client!');
                    else {
                        console.log(`Client ${clientName} created.\nClient ID: ${clientId}\cClient Secret: ${secret}\nRedirect URI: ${clientUri} created.`);
                    }
                });
            }
        });
});

function getUserQuestions() {
    return [
        {
            type: 'input',
            name: 'username',
            message: 'Username?'
        },
        {
            type: 'password',
            name: 'password',
            message: 'User Password?'
        }
    ];
}

function getClientQuestions() {
    return [
        {
            type: 'input',
            name: 'clientName',
            message: 'Client Name?'
        },
        {
            type: 'input',
            name: 'clientUri',
            message: 'Client Redirect URI?'
        }
    ];
}
