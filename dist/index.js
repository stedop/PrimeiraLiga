"use strict";

var _bot = require("./bot");

var _bot2 = _interopRequireDefault(_bot);

var _nodeEnvFile = require("node-env-file");

var _nodeEnvFile2 = _interopRequireDefault(_nodeEnvFile);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

(0, _nodeEnvFile2.default)("./../.env");

var botConfig = {
    'userAgent': process.env.userAgent,
    'clientId': process.env.clientId,
    'clientSecret': process.env.clientSecret,
    'refreshToken': process.env.refreshToken,
    'subreddit': process.env.subreddit,
    'apiKey': process.env.apiKey,
    'leagueSlug': process.env.leagueSlug,
    'leagueYear': process.env.leagueYear
};

var plBot = new _bot2.default(botConfig);

plBot.updateSidebar();
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map