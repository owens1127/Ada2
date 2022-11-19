import * as fs from 'fs';
import { BungieClient, configure, Tokens } from 'oodestiny';
import tokens from '../local/tokens.json' assert { type: 'json' }

/**
 * @type {BungieClient}
 */
export const client = await (async () => {
    configure(process.env.BUNGIE_NET_API_KEY, process.env.BUNGIE_NET_CLIENT_ID,
        process.env.BUNGIE_NET_SECRET);
    const newTokens = await Tokens.getAccessTokenFromRefreshToken(tokens.refresh.value);
    fs.writeFileSync('./local/tokens.json', JSON.stringify(newTokens, null, 2))
    const bc = new BungieClient(newTokens.access.value);
    console.log({new_access_token: newTokens.access});
    setInterval(refreshAccessToken, 3000000, bc);
    return bc;
})();

function refreshAccessToken(bc) {
    /** @type BungieNetTokens */
    const readTokens = JSON.parse(fs.readFileSync('./local/tokens.json'));
    Tokens.getAccessTokenFromRefreshToken(readTokens.refresh.value).then(newTokens => {
    	console.log({new_access_token: newTokens.access});
        fs.writeFileSync('./local/tokens.json', JSON.stringify(newTokens, null, 2))
        bc.login(newTokens.access.value);
    });
}

