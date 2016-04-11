'use strict';

const oauth20 = require('oauth20-provider');

module.exports = function (type) {
    const oauth = new oauth20({ log: { level: 0 } });

    const model = require(`./model/${type}`).oauth2;
    if (!model) {
        throw new Error(`Unknown model type: ${type}`);
    }

    // Set client methods
    oauth.model.client.getId = model.client.getId;
    oauth.model.client.getRedirectUri = model.client.getRedirectUri;
    oauth.model.client.checkRedirectUri = model.client.checkRedirectUri;
    oauth.model.client.fetchById = model.client.fetchById;
    oauth.model.client.checkSecret = model.client.checkSecret;

    // User
    oauth.model.user.getId = model.user.getId;
    oauth.model.user.fetchById = model.user.fetchById;
    oauth.model.user.fetchByUsername = model.user.fetchByUsername;
    oauth.model.user.fetchFromRequest = model.user.fetchFromRequest;
    oauth.model.user.checkPassword = model.user.checkPassword;

    // Refresh token
    oauth.model.refreshToken.getUserId = model.refreshToken.getUserId;
    oauth.model.refreshToken.getClientId = model.refreshToken.getClientId;
    oauth.model.refreshToken.getScope = model.refreshToken.getScope;
    oauth.model.refreshToken.fetchByToken = model.refreshToken.fetchByToken;
    oauth.model.refreshToken.removeByUserIdClientId = model.refreshToken.removeByUserIdClientId;
    oauth.model.refreshToken.removeByRefreshToken = model.refreshToken.removeByRefreshToken;
    oauth.model.refreshToken.create = model.refreshToken.create;

    // Access token
    oauth.model.accessToken.getToken = model.accessToken.getToken;
    oauth.model.accessToken.fetchByToken = model.accessToken.fetchByToken;
    oauth.model.accessToken.checkTTL = model.accessToken.checkTTL;
    oauth.model.accessToken.getTTL = model.accessToken.getTTL;
    oauth.model.accessToken.fetchByUserIdClientId = model.accessToken.fetchByUserIdClientId;
    oauth.model.accessToken.create = model.accessToken.create;

    // Code
    oauth.model.code.create = model.code.create;
    oauth.model.code.fetchByCode = model.code.fetchByCode;
    oauth.model.code.removeByCode = model.code.removeByCode;
    oauth.model.code.getUserId = model.code.getUserId;
    oauth.model.code.getClientId = model.code.getClientId;
    oauth.model.code.getScope = model.code.getScope;
    oauth.model.code.checkTTL = model.code.getScope;

    // Decision controller
    oauth.decision = function(req, res, client, scope, user) {
        res.render('authorise', { client, scope, user });
    };

    return oauth;
};
