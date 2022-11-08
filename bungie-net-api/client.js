const { configure, Client } = require('oodestiny');

const client = newClient();

function newClient() {
    configure(process.env.BUNGIE_NET_API_KEY, process.env.BUNGIE_NET_CLIENT_ID, process.env.BUNGIE_NET_SECRET);
    return new Client();
}

module.exports = client;

