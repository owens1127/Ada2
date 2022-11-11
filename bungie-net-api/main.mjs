import config from '../config.json'
import { configure, BungieClient, generateOAuthURL } from 'oodestiny';
import {
    getAccessTokenFromAuthCode,
    getAccessTokenFromRefreshToken
} from 'oodestiny/util/tokens.js';
/**
 * @type {BungieClient}
 */
export const client = await (async () => {
    configure(process.env.BUNGIE_NET_API_KEY, process.env.BUNGIE_NET_CLIENT_ID, process.env.BUNGIE_NET_SECRET);
    const tokens = await getAccessTokenFromRefreshToken(config.refresh);
    return new BungieClient(tokens.access.value);
})();

export const destinyManifest = (await client.Destiny2.GetDestinyManifest()).Response;

