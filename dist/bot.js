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

    updateSidebar() {
        var _this3 = this;

        var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var subreddit = this.subreddit;
        var desc = this.templateEngine.sidebar(data);
        return new Promise(function (resolve, reject) {
            _this3.redditClient.getSubreddit(subreddit).editSettings({
                'description': desc
            }).then(function () {
                data.completed = {};
                data.completed.updateSidebar = true;
                resolve(data);
            }).catch(function (error) {
                reject(error);
            });
        });
    }

    run() {
        var _this4 = this;

        return new Promise(function (resolve, reject) {
            _this4.getCompetition().then(function (data) {
                return _this4.getStandings(data);
            }).then(function (data) {
                return _this4.updateSidebar(data);
            }).then(function (data) {
                resolve(data);
            }).catch(function (error) {
                reject(error);
            });
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