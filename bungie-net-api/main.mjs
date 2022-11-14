import * as fs from 'fs';
import { BungieClient, configure } from 'oodestiny';
import { getAccessTokenFromRefreshToken } from 'oodestiny/util/tokens.js';
import tokens from '../tokens.json' assert { type: 'json' }

/**
 * @type {BungieClient}
 */
export const client = await (async () => {
    configure(process.env.BUNGIE_NET_API_KEY, process.env.BUNGIE_NET_CLIENT_ID,
        process.env.BUNGIE_NET_SECRET);
    const newTokens = await getAccessTokenFromRefreshToken(tokens.refresh.value);
    fs.writeFileSync('./tokens.json', JSON.stringify(newTokens, null, 2))
    const bc = new BungieClient(newTokens.access.value);
    console.log({new_access_token: newTokens.access});
    setInterval(refreshAccessToken, 3000000, bc);
    return bc;
})();

function refreshAccessToken(bc) {
    /** @type BungieNetTokens */
    const readTokens = JSON.parse(fs.readFileSync('./tokens.json'));
    getAccessTokenFromRefreshToken(readTokens.refresh.value).then(newTokens => {
    	console.log({new_access_token: newTokens.access});
        fs.writeFileSync('./tokens.json', JSON.stringify(newTokens, null, 2))
        bc.login(newTokens.access.value);
    });
}

