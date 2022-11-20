import { Manifest } from 'oodestiny';
import { client } from './main.mjs';

const cache = {}

function clearManifestCache() {
    console.log('Manifest cache cleared')
    for (let prop in cache){
        if (cache.hasOwnProperty(prop)){
            delete cache[prop];
        }
    }
}

async function destinyManifest(force) {
    console.log('Fetching Destiny 2 Manifest');
    cache.manifest =
        cache.manifest && !force ? cache.manifest : await (async () => {
            setTimeout(clearManifestCache,60 * 60000);
            return client.Destiny2.GetDestinyManifest().then(r => r.Response);
        })();
    return cache.manifest;
}

/**
 * Gets the DestinyInventoryItemDefinition in english
 * @return {Promise<{[p: number]: DestinyInventoryItemDefinition}>}
 */
export async function getDestinyInventoryItemDefinitions(force) {
    cache.DestinyInventoryItemDefinition =
        cache.DestinyInventoryItemDefinition && !force ? cache.DestinyInventoryItemDefinition
            : Manifest.getDestinyManifestComponent({
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