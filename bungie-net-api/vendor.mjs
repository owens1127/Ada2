import { Components } from 'oodestiny/manifest/index.js';
import { BungieMembershipType, DestinyComponentType } from 'oodestiny/schemas/index.js';
import config from '../config.json' assert { type: 'json' };
import { client } from './main.mjs';
import { getDefinition, getDestinyInventoryItemDefinitions } from './manifest.mjs';

/**
 * Returns the available hashes at Ada-1
 * @return {Promise<number[]>}
 */
async function getAdaSaleHashes() {
    return client.Destiny2.GetVendor({
        characterId: config.characterId,
        destinyMembershipId: config.membershipId,
        membershipType: BungieMembershipType.TigerSteam,
        vendorHash: config.ada1Hash,
        components: [DestinyComponentType.VendorSales,
        DestinyComponentType.ItemPerks, DestinyComponentType.ItemStats]
    }).then(({ Response }) => {
        return Object.keys(Response.sales.data).map(id => {
            return Response.sales.data[id].itemHash;
        });
    })
}

/**
 * @typedef DefsTriple
 * @property {DestinyInventoryItemDefinition} inventoryDefinition
 * @property {DestinyCollectibleDefinition} collectibleDefinition
 * @property {DestinySandboxPerkDefinition} sandboxDefinition
 */

/**
 * Returns the definitions for all Ada's sales
 * @return {Promise<DefsTriple[]>}
 */
export async function getAdaCombatModsSaleDefinitons(force) {
    const [hashes, inventoryItemDefinition] = await Promise.all([
        getAdaSaleHashes(), 
        getDestinyInventoryItemDefinitions(force)]);
    return await Promise.all(hashes.map(h => {
        return inventoryItemDefinition[h];
    }).filter(d => {
        return d.uiItemDisplayStyle === 'ui_display_style_energy_mod'
            && d.plug?.plugCategoryIdentifier.includes('enhancements.season_');
    }).map(async inventoryDefinition => {
        const [collectibleDefinition, sandboxDefinition] = await Promise.all([
            getDefinition(Components.DestinyCollectibleDefinition, inventoryDefinition.collectibleHash),
            getDefinition(Components.DestinySandboxPerkDefinition, inventoryDefinition.perks[0].perkHash)]);
        return {
            inventoryDefinition,
            collectibleDefinition,
            sandboxDefinition
        }
    }));
}