'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _defaults2 = require('lodash/defaults');

var _defaults3 = _interopRequireDefault(_defaults2);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _snoowrap = require('snoowrap');

var _snoowrap2 = _interopRequireDefault(_snoowrap);

var _dot = require('dot');

var _dot2 = _interopRequireDefault(_dot);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class bot {

    /**
     * @summary initialises the bot
     *
     * @param {string} [userAgent] A unique description of what your app does. This argument is not necessary when Snoowrap
     is running in a browser.
     * @param {string} [clientId] The client ID of your app (assigned by reddit)
     * @param {string} [clientSecret] The client secret of your app (assigned by reddit). If you are using a refresh token
     with an installed app (which does not have a client secret), pass an empty string as your `clientSecret`.
     * @param {string} [refreshToken] A refresh token for your app.
     * @param {string} [subreddit] The subreddit name we are going to be managing
     * @param {string} [apiKey] Key for the stats api
     * @param {string} [leagueId] Id for the competition
     */
    constructor() {
        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            userAgent = _ref.userAgent,
            clientId = _ref.clientId,
            clientSecret = _ref.clientSecret,
            refreshToken = _ref.refreshToken,
            subreddit = _ref.subreddit,
            apiKey = _ref.apiKey,
            leagueId = _ref.leagueId;

        if (clientId === undefined || clientSecret === undefined || refreshToken === undefined) {
            throw new Error('Reddit Credentials not supplied');
        }

        if (apiKey === undefined) {
            throw new Error('Api Key not supplied');
        }

        if (leagueId === undefined) {
            throw new Error('Need a competition ID');
        }

        (0, _defaults3.default)(this, {
            userAgent,
            clientId,
            clientSecret,
            refreshToken,
            subreddit,
            apiKey,
            leagueId
        }, {
            userAgent: null,
            clientId: null,
            clientSecret: null,
            refreshToken: null,
            subbreddit: null,
            apiKey: null,
            leagueId: 439
        });

        this.__initRedditClient();
        this.__initApiClient();
        this.__initTemplateEngine();
    }

    __initRedditClient() {
        this.redditClient = new _snoowrap2.default({
            userAgent: this.userAgent,
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            refreshToken: this.refreshToken
        });
    }

    __initApiClient() {
        var clientArgs = {
            baseURL: 'http://api.football-data.org/v1/',
            timeout: 10000,
            headers: {
                "X-Auth-Token": this.apiKey,
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        };
        this.apiClient = _axios2.default.create(clientArgs);
    }

    __initTemplateEngine() {
        this.templateEngine = _dot2.default.process({ templateSettings: { strip: false }, path: 'views/' });
    }

    __replaceText() {
        var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            old = _ref2.old,
            begin = _ref2.begin,
            end = _ref2.end,
            replacement = _ref2.replacement;

        var regstring = '(' + begin + ')([\\s\\S]*?)(\\*\\*\\*\\*\\*\\*)';
        var regex = new RegExp(regstring, 'i');
        return old.replace(regex, replacement);
    }

    /**
     * get the current standings
     *
     * @param data
     * @returns {Promise}
     */
    getStandings() {
        var _this = this;

        var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var standingsURI = "competitions/" + this.leagueId + "/leagueTable";

        return new Promise(function (resolve, reject) {
            _this.apiClient.get(standingsURI).then(function (response) {
                data.standings = response.data;
                resolve(data);
            }, function (error) {
                reject(error);
            });
        });
    }

    getCompetition() {
        var _this2 = this;

        var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var competitionUri = "competitions/" + this.leagueId;
        return new Promise(function (resolve, reject) {
            _this2.apiClient.get(competitionUri).then(function (response) {
                data.competition = response.data;
                resolve(data);
            }, function (error) {
                reject(error);
            });
        });
    }

    /**
     * Handles the replacements
     *
     * @param data
     * @returns {Promise}
     */
    formatSidebarText() {
        var _this3 = this;

        var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var subreddit = this.subreddit;
        var table = this.templateEngine.table(data);
        var beginText = '## ' + data.standings.leagueCaption;
        var endText = '\\n\\n\\n----';
        return new Promise(function (resolve, reject) {
            _this3.redditClient.getSubreddit(subreddit).getSettings().then(function (settings) {
                data.sidebar = _this3.__replaceText({
                    'old': settings.description,
                    'begin': beginText,
                    'end': endText,
                    'replacement': table
                });
                resolve(data);
            }, function (error) {
                reject(error);
            });
        });
    }

    /**
     * Updates the sidebar
     *
     * @param data
     * @returns {Promise}
     */
    updateSidebar() {
        var _this4 = this;

        var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var subreddit = this.subreddit;

        return new Promise(function (resolve, reject) {
            _this4.redditClient.getSubreddit(subreddit).editSettings({
                'description': data.sidebar
            }).then(function () {
                data.completed = {};
                data.completed.updateSidebar = true;
                resolve(data);
            }, function (error) {
                reject(error);
            });
        });
    }

    run() {
        var _this5 = this;

        return new Promise(function (resolve, reject) {
            _this5.getStandings().then(function (data) {
                return _this5.formatSidebarText(data);
            }).then(function (data) {
                return _this5.updateSidebar(data);
            }).then(resolve).catch(reject);
        });
    }
}
exports.default = bot;
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map