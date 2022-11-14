import { BungieMembershipType, DestinyComponentType } from 'oodestiny/schemas/index.js';
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
    return client.Destiny2.SearchDestinyPlayerByBungieName(
        { membershipType: BungieMembershipType.All },
        { displayName, displayNameCode }).then(r => {
        if (!r.Response[0]) throw Error('Profile not found');
        return {
            membershipId: r.Response[0].membershipId,
            membershipType: r.Response[0].membershipType,
            name: r.Response[0].bungieGlobalDisplayName + '#'
                + r.Response[0].bungieGlobalDisplayNameCode
        };
    });
}

/**
 *
 * @param hashes
 * @param membershipId
 * @param membershipType
 * @return {Promise<{data: {[hash: string]: DestinyCollectibleState}, membershipId}>}
 */
export async function missingMods(hashes, membershipId, membershipType) {
    return client.Destiny2.GetProfile({
        destinyMembershipId: membershipId,
        membershipType,
        components: [DestinyComponentType.Collectibles]
        // privacy might prevent the bot from getting some profiles
    }).then(r => {
        const collectibles = r.Response.profileCollectibles.data?.collectibles
        return {
            membershipId,
            data: Object.assign({}, ...hashes.map((hash) => (
                // here we just assume the user has the mod if they are private
                { [hash]: (collectibles ? collectibles[hash].state : 0) }
            )))
        }
    });

}