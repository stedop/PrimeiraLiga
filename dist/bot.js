'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _sortBy2 = require('lodash/sortBy');

var _sortBy3 = _interopRequireDefault(_sortBy2);

var _find2 = require('lodash/find');

var _find3 = _interopRequireDefault(_find2);

var _merge2 = require('lodash/merge');

var _merge3 = _interopRequireDefault(_merge2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _defaults2 = require('lodash/defaults');

var _defaults3 = _interopRequireDefault(_defaults2);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _snoowrap = require('snoowrap');

var _snoowrap2 = _interopRequireDefault(_snoowrap);

var _dot = require('dot');

var _dot2 = _interopRequireDefault(_dot);

var _teamcodes = require('./teamcodes');

var _teamcodes2 = _interopRequireDefault(_teamcodes);

var _dateformat = require('dateformat');

var _dateformat2 = _interopRequireDefault(_dateformat);

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

        this.standingsURI = "competitions/" + this.leagueId + "/leagueTable";
        this.fixturesURI = "competitions/" + this.leagueId + "/fixtures?timeFrame=n7";
        this.competitionUri = "competitions/" + this.leagueId;
        this.data = {};
        this.errorBag = {};

        this.__initRedditClient();
        this.__initApiClient();
        this.__initTemplateEngine();
    }

    /**
     * Sets up snoowrap
     *
     * @private
     */
    __initRedditClient() {
        this.redditClient = new _snoowrap2.default({
            userAgent: this.userAgent,
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            refreshToken: this.refreshToken
        });
    }

    /**
     * Sets up the Axios api client
     *
     * @private
     */
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

    /**
     * Sets up the Dot template engine
     *
     * @private
     */
    __initTemplateEngine() {
        this.templateEngine = _dot2.default.process({ templateSettings: { strip: false }, path: 'views/' });
    }

    /**
     * Handles the text replacements
     *
     * @param old
     * @param begin
     * @param end
     * @param replacement
     * @returns {string|*|void|XML}
     * @private
     */
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

    getStandings() {
        var _this = this;

        return this.apiClient.get(this.standingsURI).then(function (response) {
            _this.data.standings = response.data;
        });
    }

    getFixtures() {
        var _this2 = this;

        return this.apiClient.get(this.fixturesURI).then(function (response) {
            _this2.data.fixtures = response.data.fixtures;
        });
    }

    getCompetition() {
        var _this3 = this;

        return this.apiClient.get(this.competitionUri).then(function (response) {
            _this3.data.competition = response.data;
        });
    }

    /**
     * Gets the current sidebar
     *
     * @returns {Promise}
     */
    getCurrentSideBar() {
        var _this4 = this;

        return this.redditClient.getSubreddit(this.subreddit).getSettings().then(function (response) {
            _this4.data.sidebar = response.description;
        });
    }

    /**
     * get the data form the API
     *
     * @returns {Promise}
     */
    getData() {
        return Promise.all([this.getStandings(), this.getFixtures(), this.getCompetition(), this.getCurrentSideBar()]);
    }

    /**
     * Handles the league table insert
     *
     * @returns bot
     */
    doTable() {
        var self = this;

        var update = function (arr, key, newval) {
            var match = (0, _find3.default)(arr, key);

            if (match) {
                (0, _merge3.default)(match, newval);
            } else {
                arr.push(newval);
            }
        };

        // add the team badges
        (0, _each3.default)(this.data.standings.standing, function (entry) {
            var teamInfo = _teamcodes2.default[entry.teamName];
            update(self.data.standings.standing, { 'teamName': entry.teamName }, { 'style': teamInfo.style });
            update(self.data.standings.standing, { 'teamName': entry.teamName }, { 'teamName': teamInfo.teamName });
        });

        this.data.sidebar = this.__replaceText({
            'old': this.data.sidebar,
            //# [](#pt-NOS) Primeira Liga 2016/17 - Current Table
            'begin': '# \\[\\]\\(\\#pt-NOS\\) ' + this.data.standings.leagueCaption + ' - Current Table',
            'end': '******',
            'replacement': this.templateEngine.table(this.data)
        });

        return this;
    }

    /**
     * Handles the standing insert
     *
     * @returns bot
     */
    doFixtures() {
        var self = this;

        var update = function (arr, key, newval) {
            var match = (0, _find3.default)(arr, key);

            if (match) {
                (0, _merge3.default)(match, newval);
            } else {
                arr.push(newval);
            }
        };

        // ensure that the fixtures are sorted properly
        this.data.fixtures = (0, _sortBy3.default)(this.data.fixtures, ['date']);

        (0, _each3.default)(this.data.fixtures, function (entry) {
            var date = new Date(entry.date);

            // add the team badges
            update(self.data.fixtures, { 'homeTeamName': _teamcodes2.default[entry.homeTeamName].teamName }, { 'homeTeamStyle': _teamcodes2.default[entry.homeTeamName].style });
            update(self.data.fixtures, { 'awayTeamName': _teamcodes2.default[entry.awayTeamName].teamName }, { 'awayTeamStyle': _teamcodes2.default[entry.awayTeamName].style });

            //format the date
            update(self.data.fixtures, { 'date': entry.date }, { 'date': (0, _dateformat2.default)(date, 'dd mmm.') });
        });

        this.data.sidebar = this.__replaceText({
            'old': this.data.sidebar,
            'begin': '# \\[\\]\\(\\#pt-NOS\\) ' + this.data.standings.leagueCaption + ' - Fixtures',
            'end': '\\n\\n\\n******',
            'replacement': this.templateEngine.fixtures(this.data)
        });

        return this;
    }

    /**
     * Updates the sidebar
     *
     * @returns {Promise}
     */
    updateSidebar() {
        var _this5 = this;

        var subreddit = this.subreddit;

        return this.redditClient.getSubreddit(subreddit).editSettings({
            'description': this.data.sidebar
        }).then(function () {
            _this5.data.completed = {};
            _this5.data.completed.updateSidebar = true;
        });
    }
}
exports.default = bot;
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map
//# sourceMappingURL=bot.js.map