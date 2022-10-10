import * as Bungie from 'd2-api-manager';
import * as Destiny from 'bungie-api-ts/destiny2';

console.log(Bungie);
Bungie.configure({
    BUNGIE_API_KEY: process.env.BUNGIE_NET_API_KEY,
    BUNGIE_CLIENT_ID: process.env.BUNGIE_NET_CLIENT_ID,
    BUNGIE_SECRET: process.env.BUNGIE_NET_SECRET
});

const client = new Bungie.DestinyAPIClient();
export default client;

