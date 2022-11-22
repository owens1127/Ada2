import { Collection } from 'discord.js';
import { BungieMembershipType, DestinyComponentType } from 'oodestiny/schemas/index.js';
import { client } from './main.mjs';

class Profile {
    constructor() {
        /**
         * Item Hash mapped to collectible value
         * @type {DestinyCollectibleComponent}
         */
        this.collectibles = new Collection();
    }
}

export const profiles = {
    /**
     * @type {Collection<string,Profile>}
     */
    cache: new Collection(),
}

/**
 * Finds the details on a member
 * @param {string} bungieName
 * @return {Promise<{membershipType: BungieMembershipType, name: string, membershipId: string}>}
 */
export async function findMemberDetails(bungieName) {
    const props = bungieName.split('#');
    const displayName = props[0];
    const displayNameCode = parseInt(props[1]);
    return client.Destiny2.SearchDestinyPlayerByBungieName(
        { membershipType: BungieMembershipType.All },
        { displayName, displayNameCode })
        .then(r => {
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
 * Find the mods a member is missing
 * @param {(string | number)[]} hashes
 * @param {string} membershipId
 * @param {number} membershipType
 * @return {Promise<Collection<number,number>>} Collection of hashes mapped to numbers
 */
export async function missingMods(hashes, membershipId, membershipType) {
    if (profiles.cache.get(membershipId)?.collectibles) {
        return new Collection(hashes.forEach((hash) => [hash, profiles.cache.get(membershipId).collectibles[hash]?.state || 0]));
    } else {
        return client.Destiny2.GetProfile({
            destinyMembershipId: membershipId,
            membershipType,
            components: [DestinyComponentType.Collectibles]
        }).then(r => {
            // note: privacy might prevent some profiles from returning the components
            const collectiblesComponent = r.Response.profileCollectibles.data?.collectibles || {}
            const p = new Profile();
    
            profiles.cache.set(membershipId, p);
            return new Collection(hashes.map((hash) => {
                p.collectibles.set(hash, collectiblesComponent[hash])
                return [hash, collectiblesComponent[hash]?.state || 0]
            }));
        });
    }

}