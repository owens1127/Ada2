import { RuntimeGroupMemberType } from 'oodestiny/schemas/index.js';
import { client } from './main.mjs';

/**
 *
 * @param groupId
 * @return {Promise<GroupV2>}
 */
export async function getClan(groupId) {
    return client.GroupV2.GetGroup({groupId}).then(r => {
        if (!r.Response) {
            throw Error(`Clan id ${groupId} not found`);
        }
        return r.Response?.detail

    })
}

/**
 *
 * @param {string} groupId
 * @param {number} currentpage
 * @return {Promise<SearchResultOfGroupMember>}
 */
export async function getMembersOfClan(groupId, currentpage) {
    return client.GroupV2.GetMembersOfGroup({
        currentpage,
        groupId,
        memberType: RuntimeGroupMemberType.None,
    }).then(r => {
        if (!r.Response) {
            throw Error(`Clan id ${groupId} not found`);
        }
        return r.Response;
    })
}