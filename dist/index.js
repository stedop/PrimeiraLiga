"use strict";

var _bot = require("./bot");

var _bot2 = _interopRequireDefault(_bot);

var _nodeEnvFile = require("node-env-file");

var _nodeEnvFile2 = _interopRequireDefault(_nodeEnvFile);

var _winston = require("winston");

var _winston2 = _interopRequireDefault(_winston);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

(0, _nodeEnvFile2.default)(".env");

var logger = new _winston2.default.Logger({
    transports: [new _winston2.default.transports.Console(), new _winston2.default.transports.File({ filename: process.env.logFile })]
});

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

try {
    var plBot = new _bot2.default(botConfig);
    plBot.updateSidebar();
} catch (error) {
    console.log(error);
    logger.log(error);
}
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
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map