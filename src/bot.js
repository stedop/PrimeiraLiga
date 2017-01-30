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

    __initRedditClient() {
        this.redditClient = new Snoowrap( {
            userAgent: this.userAgent,
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            refreshToken: this.refreshToken
        } );
    }

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

    __initTemplateEngine() {
        this.templateEngine = Dot.process( { templateSettings: { strip: false }, path: 'views/' } );
    }

    __replaceText( {
        old,
        begin,
        end,
        replacement
    } = {} ) {
        let regstring = '(' + begin + ')([\\s\\S]*?)(\\*\\*\\*\\*\\*\\*)';
        let regex = new RegExp(regstring, 'i');
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
     * Handles the replacements
     *
     * @param data
     * @returns {Promise}
     */
    formatSidebarText( data = {} ) {
        let subreddit = this.subreddit;
        let table = this.templateEngine.table( data );
        let beginText = '## ' + data.standings.leagueCaption;
        let endText = '\\n\\n\\n----';
        return new Promise( (resolve, reject ) => {
            this.redditClient.getSubreddit( subreddit ).getSettings()
                .then(
                    ( settings ) => {
                        data.sidebar = this.__replaceText( {
                            'old': settings.description,
                            'begin': beginText,
                            'end': endText,
                            'replacement': table
                        } );
                        resolve( data );
                    },
                    ( error ) => {
                        reject( error );
                    }
                );
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

    run() {
        return new Promise( ( resolve, reject ) => {
            this.getStandings()
                .then( ( data ) => this.formatSidebarText( data ) )
                .then( ( data ) => this.updateSidebar( data ) )
                .then(resolve)
                .catch(reject);
        } );

    }
}