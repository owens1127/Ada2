import { Manifest } from 'oodestiny';
import { client } from './main.mjs';

let destinyManifestCache;

async function destinyManifest(force) {
    console.log('Fetching Destiny 2 Manifest');
    destinyManifestCache = destinyManifestCache && !force ? destinyManifestCache : await (async () => {
        setTimeout(clearManifestCache, 3 * 60 * 60000);
        return client.Destiny2.GetDestinyManifest().then(r => r.Response);
    })();
    return destinyManifestCache;
}

function clearManifestCache() {
    console.log('Manifest cache cleared')
    destinyManifestCache = null;
}

const cache = {};

/**
 * Gets the DestinyInventoryItemDefinition in english
 * @return {Promise<{[p: number]: DestinyInventoryItemDefinition}>}
 */
export async function getDestinyInventoryItemDefinitions(force) {
    cache.DestinyInventoryItemDefinition =
        cache.DestinyInventoryItemDefinition || await Manifest.getDestinyManifestComponent({
            destinyManifest: await destinyManifest(force),
            tableName: Manifest.Components.DestinyInventoryItemDefinition,
            language: 'en'
        });
    return cache.DestinyInventoryItemDefinition;
}

/**
 *
 * @param {string} definition
 * @param {number | string} hash
 * @return {Promise<DestinyDefinition>}
 */
export async function getDefinition(definition, hash) {
    return client.Destiny2.GetDestinyEntityDefinition({
        entityType: definition,
        hashIdentifier: hash
    }).then(r => r.Response);
}