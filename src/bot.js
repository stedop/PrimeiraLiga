'use strict';

import { defaults } from 'lodash';
import Axios from 'axios';
import Snoowrap from 'snoowrap';
import Dot from 'dot';

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

    /**
     * get the current standings
     *
     * @param data
     * @returns {Promise}
     */
    getStandings( data = {} ) {
        let standingsURI = "competitions/" + this.leagueId + "/leagueTable";

        return new Promise( ( resolve, reject ) => {
            this.apiClient.get( standingsURI ).then(
                ( response ) => {
                    data.standings = response.data;
                    resolve( data );
                },
                ( error ) => {
                    reject( error );
                }
            );
        } );
    }

    /**
     * Gets the competition data
     *
     * @param data
     * @returns {Promise}
     */
    getCompetition( data = {} ) {
        let competitionUri = "competitions/" + this.leagueId;
        return new Promise( ( resolve, reject ) => {
            this.apiClient.get( competitionUri ).then(
                ( response ) => {
                    data.competition = response.data;
                    resolve( data );
                },
                ( error ) => {
                    reject( error );
                }
            );
        } );
    }

    /**
     * Get fixtures
     *
     * @param data
     * @returns {Promise}
     */
    getFixtures( data = {} ) {
        return new Promise( ( resolve ) => {
            resolve( data );
        } );
    }

    /**
     * Gets the current sidebar
     *
     * @param data
     * @returns {Promise}
     */
    getCurrentSideBar( data = {} ) {
        return new Promise( ( resolve, reject ) => {
            this.redditClient.getSubreddit( this.subreddit ).getSettings().then(
                ( settings ) => {
                    data.sidebar = settings.description;
                    resolve( data );
                }, reject
            );
        } );

    }

    /**
     * Handles the league table insert
     *
     * @param data
     * @returns {Promise}
     */
    doTable( data = {} ) {
        return new Promise( ( resolve ) => {
            data.sidebar = this.__replaceText( {
                'old': data.sidebar,
                'begin': '# [](#pt-NOS)' + data.standings.leagueCaption + ' - Current Table',
                'end': '\\n\\n\\n******',
                'replacement': this.templateEngine.table( data )
            } );
            resolve( data );
        } );
    }

    /**
     * Handles the standing insert
     *
     * @param data
     * @returns {Promise}
     */
    doFixtures( data = {} ) {
        return new Promise( ( resolve ) => {
            data.sidebar = this.__replaceText( {
                'old': data.sidebar,
                'begin': '# [](#pt-NOS)' + data.standings.leagueCaption,
                'end': '\\n\\n\\n******',
                'replacement': this.templateEngine.table( data )
            } );
            resolve( data );
        } );
    }


    /**
     * Updates the sidebar
     *
     * @param data
     * @returns {Promise}
     */
    updateSidebar( data = {} ) {
        let subreddit = this.subreddit;

        return new Promise( ( resolve, reject ) => {
            this.redditClient.getSubreddit( subreddit ).editSettings(
                {
                    'description': data.sidebar
                }
            ).then(
                () => {
                    data.completed = {};
                    data.completed.updateSidebar = true;
                    resolve( data );
                },
                ( error ) => {
                    reject( error );
                }
            );
        } );
    }

    /**
     * Runs the whole thing together - tbh I'm not sure this should be here and not in the index file
     */
    run() {
        this.getStandings()
            .then( ( data ) => this.getCurrentSideBar( data ) )
            .then( ( data ) => this.getStandings( data ) )
            .then( ( data ) => this.getFixtures( data ) )
            .then( ( data ) => this.doTable( data ) )
            .then( ( data ) => this.doFixtures( data ) )
            .then( ( data ) => this.updateSidebar( data ) );
    }
}