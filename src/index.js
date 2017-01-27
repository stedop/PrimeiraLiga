import bot from "./bot";
import env from "node-env-file";
import winston from "winston";

env(".env");

const logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: process.env.logFile })
    ]
});

const botConfig = {
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
    const plBot = new bot(botConfig);
    plBot.updateSidebar();
} catch ( error ){
    console.log(error);
    logger.log(error);
}