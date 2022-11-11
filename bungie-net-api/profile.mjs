import { BungieMembershipType } from 'oodestiny/schemas/index.js';
import { client } from './main.mjs';

/**
 *
 * @param {string} bungieName
 * @return {Promise<{membershipType: BungieMembershipType, name: string, membershipId: string}>}
 */
export async function findMemberDetails(bungieName) {
    const props = bungieName.split('#');
    const displayName = props[0];
    const displayNameCode = parseInt(props[1]);
    return await client.Destiny2.SearchDestinyPlayerByBungieName(
        { membershipType: BungieMembershipType.All },
        { displayName, displayNameCode }).then(r => {
            if (!r.Response[0]) throw Error('Profile not found');
            return {
                membershipId: r.Response[0].membershipId,
                membershipType: r.Response[0].membershipType,
                name: r.Response[0].bungieGlobalDisplayName + "#" + r.Response[0].bungieGlobalDisplayNameCode
            };
    });
}