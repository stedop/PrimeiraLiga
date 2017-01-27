'use strict';

import {defaults, take} from 'lodash';
import Axios from 'axios';
import Snoowrap from 'snoowrap';

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
     * @param {string} [leagueSlug] the league identifier default is 'liga'
     * @param {string} [leagueYear] the year identifier in the form order 16-17
     */
    constructor({
        userAgent,
        clientId,
        clientSecret,
        refreshToken,
        subreddit,
        apiKey,
        leagueSlug,
        leagueYear
    } = {}) {
        if (clientId === undefined || clientSecret === undefined || refreshToken === undefined) {
            throw new Error('Reddit Credentials not supplied');
        }

        if (apiKey === undefined) {
            throw new Error('Api Key not supplied');
        }

        if (leagueSlug === undefined || leagueYear === undefined) {
            throw new Error('Need a league and a year');
        }

        defaults(this, {userAgent, clientId, clientSecret, refreshToken, subreddit, apiKey, leagueSlug, leagueYear},{
            userAgent:null,
            clientId:null,
            clientSecret:null,
            refreshToken:null,
            subbreddit:null,
            apiKey: null,
            leagueSlug: "liga",
            leagueYear: "16-17"
        });

        this.__initRedditClient();
        this.__initApiClient();
    }

    __initRedditClient() {
        this.redditClient = new Snoowrap({
            userAgent: this.userAgent,
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            refreshToken: this.refreshToken
        });
    }

    __initApiClient() {
        let clientArgs = {
            baseURL: 'https://sportsop-soccer-sports-open-data-v1.p.mashape.com/v1/',
            timeout: 1000,
            headers: {
                "X-Mashape-Key": this.apiKey,
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        };
        this.apiClient = Axios.create(clientArgs);
    }

    getStandings() {
        let standingsURI = "leagues/" + this.leagueSlug + "/seasons/" + this.leagueYear + "/standings";

        return new Promise((resolve, reject) => {
            this.apiClient.get(standingsURI).then(
                (standings) => {
                    resolve(standings.data.data.standings);
                },
                (error) => {
                    reject(new Error("Problem getting standings", error.id));
                }
            );
        });
    }

    updateSidebar() {
        let subreddit = this.subreddit;
        this.getStandings().then(
            ( standingsData ) => {
                standingsData = take(standingsData, 10);
                console.log(standingsData.length);
                this.redditClient.getSubreddit(subreddit).editSettings(
                    {
                        'description': JSON.stringify(standingsData)
                    }
                ).then(
                    (response) => {
                        console.log(response);
                        console.log("done");
                    }
                ).catch(
                    ( error ) => {
                        console.log(error);
                    }
                );
            }).catch(
                ( error ) => {
                    throw new Error(error);
                }
        );
    }
}

