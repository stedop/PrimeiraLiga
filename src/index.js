import bot from "./bot";
import env from "node-env-file";

env("./../.env");

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

const plBot = new bot(botConfig);


plBot.updateSidebar();