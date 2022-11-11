import { Manifest } from 'oodestiny';
import { BungieMembershipType, DestinyComponentType } from 'oodestiny/schemas/index.js';
import { client, destinyManifest } from './main.mjs';
import config from "../config.json";

/**
 * Returns the available hashes at Ada-1
 * @return {Promise<number[]>}
 */
async function getAdaSaleHashes() {
    return await client.Destiny2.GetVendor({
        characterId: config.characterId,
        destinyMembershipId: config.membershipId,
        membershipType: BungieMembershipType.TigerSteam,
        vendorHash: config.ada1Hash,
        components: [DestinyComponentType.VendorSales]
    }).then(({Response}) => {
        return Object.keys(Response.sales.data).map(vid => {
            return Response.sales.data[vid].itemHash;
        });
    })
}

let manifestInventoryItemDefinition = null;
/**
 * Gets the DestinyInventoryItemDefinition in english
 * @return {Promise<{[p: number]: DestinyInventoryItemDefinition}>}
 */
async function getDestinyInventoryItemDefinition() {
    manifestInventoryItemDefinition = manifestInventoryItemDefinition || await Manifest.getDestinyManifestComponent({
        destinyManifest,
        tableName: Manifest.Components.DestinyInventoryItemDefinition,
        language: 'en'
    });
    return manifestInventoryItemDefinition;
}

/**
 * Returns the definitions for all Ada's sales
 * @return {Promise<DestinyInventoryItemDefinition[]>}
 */
export async function getAdaCombatModsSaleDefinitons() {
    const hashes = await getAdaSaleHashes();
    const definition = await getDestinyInventoryItemDefinition();
    return hashes.map(h => definition[h]).filter(d => {
        return d.uiItemDisplayStyle === 'ui_display_style_energy_mod'
            && d.plug?.plugCategoryIdentifier === 'enhancements.season_v480'
    });
}