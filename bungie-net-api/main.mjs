import { BungieClient, configure } from 'oodestiny';
import { getAccessTokenFromRefreshToken } from 'oodestiny/util/tokens.js';
import config from '../config.json'

/**
 * @type {BungieClient}
 */
export const client = await (async () => {
    configure(process.env.BUNGIE_NET_API_KEY, process.env.BUNGIE_NET_CLIENT_ID,
        process.env.BUNGIE_NET_SECRET);
    const tokens = await getAccessTokenFromRefreshToken(config.refresh);
    return new BungieClient(tokens.access.value);
})();

