'use strict';

import { defaults, each, merge, find, sortBy } from 'lodash';
import Axios from 'axios';
import Snoowrap from 'snoowrap';
import Dot from 'dot';
import TeamCodes from './teamcodes';
import DateFormat from 'dateformat';

export default class bot {

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
    constructor( {
        userAgent,
        clientId,
        clientSecret,
        refreshToken,
        subreddit,
        apiKey,
        leagueId
    } = {} ) {
        if ( clientId === undefined || clientSecret === undefined || refreshToken === undefined ) {
            throw new Error( 'Reddit Credentials not supplied' );
        }

        if ( apiKey === undefined ) {
            throw new Error( 'Api Key not supplied' );
        }

        if ( leagueId === undefined ) {
            throw new Error( 'Need a competition ID' );
        }

        defaults( this, {
            userAgent,
            clientId,
            clientSecret,
            refreshToken,
            subreddit,
            apiKey,
            leagueId,
        }, {
            userAgent: null,
            clientId: null,
            clientSecret: null,
            refreshToken: null,
            subbreddit: null,
            apiKey: null,
            leagueId: 439
        } );

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
        this.redditClient = new Snoowrap( {
            userAgent: this.userAgent,
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            refreshToken: this.refreshToken
        } );
    }

    /**
     * Sets up the Axios api client
     *
     * @private
     */
    __initApiClient() {
        let clientArgs = {
            baseURL: 'http://api.football-data.org/v1/',
            timeout: 10000,
            headers: {
                "X-Auth-Token": this.apiKey,
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        };
        this.apiClient = Axios.create( clientArgs );
    }

    /**
     * Sets up the Dot template engine
     *
     * @private
     */
    __initTemplateEngine() {
        this.templateEngine = Dot.process( { templateSettings: { strip: false }, path: 'views/' } );
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
    __replaceText( {
        old,
        begin,
        end,
        replacement
    } = {} ) {
        let regstring = '(' + begin + ')([\\s\\S]*?)(\\*\\*\\*\\*\\*\\*)';
        let regex = new RegExp( regstring, 'i' );
        return old.replace( regex, replacement );
    }

    getStandings() {
        return this.apiClient.get( this.standingsURI ).then(
            ( response ) => {
                this.data.standings = response.data;
            }
        );
    }

    getFixtures() {
        return this.apiClient.get( this.fixturesURI )
            .then(
                ( response ) => {
                    this.data.fixtures = response.data.fixtures;
                }
            );

    }

    getCompetition() {
        return this.apiClient.get( this.competitionUri )
            .then(
                ( response ) => {
                    this.data.competition = response.data;
                }
            );
    }

    /**
     * Gets the current sidebar
     *
     * @returns {Promise}
     */
    getCurrentSideBar() {
        return this.redditClient.getSubreddit( this.subreddit ).getSettings().then(
            ( response ) => {
                this.data.sidebar = response.description;
            } );
    }

    /**
     * get the data form the API
     *
     * @returns {Promise}
     */
    getData() {
        return Promise
            .all(
                [
                    this.getStandings(),
                    this.getFixtures(),
                    this.getCompetition(),
                    this.getCurrentSideBar()
                ]
            );
    }


    /**
     * Handles the league table insert
     *
     * @returns bot
     */
    doTable() {
        let self = this;

        const update = function(arr, key, newval) {
            let match = find(arr, key);

            if(match) {
                merge( match, newval );
            } else {
                arr.push( newval );
            }
        };

        // add the team badges
        each(this.data.standings.standing, function(entry) {
            update(
                self.data.standings.standing,
                { 'teamName': entry.teamName },
                { 'style' : TeamCodes[entry.teamName] }
            );
        });

        this.data.sidebar = this.__replaceText( {
            'old': this.data.sidebar,
            //# [](#pt-NOS) Primeira Liga 2016/17 - Current Table
            'begin': '# \\[\\]\\(\\#pt-NOS\\) ' + this.data.standings.leagueCaption + ' - Current Table',
            'end': '******',
            'replacement': this.templateEngine.table( this.data )
        } );

        return this;
    }

    /**
     * Handles the standing insert
     *
     * @returns bot
     */
    doFixtures() {
        let self = this;

        const update = function(arr, key, newval) {
            let match = find(arr, key);

            if(match) {
                merge( match, newval );
            } else {
                arr.push( newval );
            }
        };

        // ensure that the fixtures are sorted properly
        this.data.fixtures = sortBy(this.data.fixtures, ['date']);

        each(this.data.fixtures, function(entry) {
            let date = new Date(entry.date);

            // add the team badges
            update(
                self.data.fixtures,
                { 'homeTeamName': entry.homeTeamName },
                { 'homeTeamStyle' : TeamCodes[entry.homeTeamName] }
            );
            update(
                self.data.fixtures,
                { 'awayTeamName': entry.awayTeamName },
                { 'awayTeamStyle' : TeamCodes[entry.awayTeamName] }
            );

            //format the date
            update(
                self.data.fixtures,
                { 'date': entry.date },
                { 'date' :  DateFormat(date, 'dd mmm.')}
            );
        });


        this.data.sidebar = this.__replaceText( {
            'old': this.data.sidebar,
            'begin': '# \\[\\]\\(\\#pt-NOS\\) ' + this.data.standings.leagueCaption + ' - Fixtures',
            'end': '\\n\\n\\n******',
            'replacement': this.templateEngine.fixtures( this.data )
        } );

        return this;
    }


    /**
     * Updates the sidebar
     *
     * @returns {Promise}
     */
    updateSidebar() {
        let subreddit = this.subreddit;

        return this.redditClient.getSubreddit( subreddit ).editSettings(
            {
                'description': this.data.sidebar
            }
        ).then(
            () => {
                this.data.completed = {};
                this.data.completed.updateSidebar = true;
            }
        );
    }
}