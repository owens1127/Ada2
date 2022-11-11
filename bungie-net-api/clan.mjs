import { client } from './main.mjs';

/**
 *
 * @param groupId
 * @return {Promise<>}
 */
export async function getClan(groupId) {
    return await client.GroupV2.GetGroup({groupId}).then(r => {
        if (!r.Response) {
            throw Error(`Clan id ${groupId} not found`);
        }
        return r.Response?.detail

    })
}