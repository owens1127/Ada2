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
 * Returns the definitions for all Ada's sales
 * @return {Promise<{inventoryDefinition: DestinyInventoryItemDefinition,
 *          collectibleDefinition: DestinyCollectibleDefinition,
 *          sandboxDefinition: DestinySandboxPerkDefinition}[]>}
 */
export async function getAdaCombatModsSaleDefinitons() {
    const hashes = await getAdaSaleHashes();
    const inventoryItemDefinition = await getDestinyInventoryItemDefinitions();
    return await Promise.all(hashes.map(h => {
        return inventoryItemDefinition[h];
    }).filter(d => {
        return d.uiItemDisplayStyle === 'ui_display_style_energy_mod'
            && d.plug?.plugCategoryIdentifier.includes('enhancements.season_');
    }).map(async inventoryDefinition => {
        return {
            inventoryDefinition,
            collectibleDefinition: await getDefinition(Components.DestinyCollectibleDefinition,
                inventoryDefinition.collectibleHash),
            sandboxDefinition: await getDefinition(Components.DestinySandboxPerkDefinition,
                inventoryDefinition.perks[0].perkHash)
        }
    }));
}