'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _take2 = require('lodash/take');

var _take3 = _interopRequireDefault(_take2);

var _defaults2 = require('lodash/defaults');

var _defaults3 = _interopRequireDefault(_defaults2);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _snoowrap = require('snoowrap');

var _snoowrap2 = _interopRequireDefault(_snoowrap);

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
     * @param {string} [leagueSlug] the league identifier default is 'liga'
     * @param {string} [leagueYear] the year identifier in the form order 16-17
     */
    constructor() {
        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            userAgent = _ref.userAgent,
            clientId = _ref.clientId,
            clientSecret = _ref.clientSecret,
            refreshToken = _ref.refreshToken,
            subreddit = _ref.subreddit,
            apiKey = _ref.apiKey,
            leagueSlug = _ref.leagueSlug,
            leagueYear = _ref.leagueYear;

        if (clientId === undefined || clientSecret === undefined || refreshToken === undefined) {
            throw new Error('Reddit Credentials not supplied');
        }

        if (apiKey === undefined) {
            throw new Error('Api Key not supplied');
        }

        if (leagueSlug === undefined || leagueYear === undefined) {
            throw new Error('Need a league and a year');
        }

        (0, _defaults3.default)(this, { userAgent, clientId, clientSecret, refreshToken, subreddit, apiKey, leagueSlug, leagueYear }, {
            userAgent: null,
            clientId: null,
            clientSecret: null,
            refreshToken: null,
            subbreddit: null,
            apiKey: null,
            leagueSlug: "liga",
            leagueYear: "16-17"
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
            baseURL: 'https://sportsop-soccer-sports-open-data-v1.p.mashape.com/v1/',
            timeout: 1000,
            headers: {
                "X-Mashape-Key": this.apiKey,
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        };
        this.apiClient = _axios2.default.create(clientArgs);
    }

    __initTemplateEngine() {
        this.templateEngine = require("dot").process({ path: "./../views" });
    }

    getStandings() {
        var _this = this;

        var standingsURI = "leagues/" + this.leagueSlug + "/seasons/" + this.leagueYear + "/standings";

        return new Promise(function (resolve, reject) {
            _this.apiClient.get(standingsURI).then(function (standings) {
                resolve(standings.data.data.standings);
            }, function (error) {
                reject(new Error("Problem getting standings", error.id));
            });
        });
    }

    updateSidebar() {
        var _this2 = this;

        var subreddit = this.subreddit;
        var templateEngine = this.templateEngine;

        this.getStandings().then(function (standingsData) {
            standingsData = (0, _take3.default)(standingsData, 10);
            _this2.redditClient.getSubreddit(subreddit).editSettings({
                'description': templateEngine.sidebar(standingsData)
            }).then(function (response) {
                console.log(response);
                console.log("done");
            }).catch(function (error) {
                console.log(error);
            });
        }).catch(function (error) {
            throw new Error(error);
        });
    }
}
exports.default = bot;
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map