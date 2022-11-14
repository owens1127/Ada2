import { Manifest } from 'oodestiny';
import { client } from './main.mjs';

const destinyManifest = (await client.Destiny2.GetDestinyManifest()).Response;
const cache = {};

/**
 * Gets the DestinyInventoryItemDefinition in english
 * @return {Promise<{[p: number]: DestinyInventoryItemDefinition}>}
 */
export async function getDestinyInventoryItemDefinitions() {
    cache.DestinyInventoryItemDefinition =
        cache.DestinyInventoryItemDefinition || await Manifest.getDestinyManifestComponent({
            destinyManifest,
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
    client.Destiny2.GetDestinyEntityDefinition({
        entityType: definition,
        hashIdentifier: hash
    }).then(r => r.Response);
}