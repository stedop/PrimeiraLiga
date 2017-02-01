import bot from "./bot";
import env from "node-env-file";
import winston from "winston";

env( ".env" );

const logger = new (winston.Logger)( {
    transports: [
//        new (winston.transports.Console)(),
        new (winston.transports.File)( {
            filename: "./logs/" + process.env.logFile,
            handleExceptions: true,
            humanReadableUnhandledException: true
        } )
    ]
} );

const botConfig = {
    'userAgent': process.env.userAgent,
    'clientId': process.env.clientId,
    'clientSecret': process.env.clientSecret,
    'refreshToken': process.env.refreshToken,
    'subreddit': process.env.subreddit,
    'apiKey': process.env.apiKey,
    'leagueId': process.env.leagueId,
};

const plBot = new bot( botConfig );
plBot
    .run()
    .then(
        ( data ) => {
            logger.log( 'info', data.completed );
        }
    )
    .catch( logger.log );
