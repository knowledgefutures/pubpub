import { useState } from 'react';

import { usePageContext, usePendingChanges } from 'utils/hooks';
import * as api from 'client/utils/members/api';

export const useMembers = ({ members, updateMembers }) => {
	const { scopeData } = usePageContext();
	const { pendingPromise } = usePendingChanges();
	const scopeIds = scopeData.elements.activeIds;

	const membersByType = {
		pub: members.filter((mb) => mb.pubId),
		collection: members.filter((mb) => mb.collectionId),
		community: members.filter((mb) => mb.communityId),
		organization: members.filter((mb) => mb.organizationId),
	};

	const addMember = (user) => {
		return pendingPromise(api.addMember({ scopeIds: scopeIds, user: user })).then((member) =>
			updateMembers([member, ...members]),
		);
	};

	const updateMember = (member, update) => {
		updateMembers(
			members.map((m) => {
				if (m.id === member.id) {
					return { ...m, ...update };
				}
				return m;
			}),
		);
		return pendingPromise(
			api.updateMember({ member: member, update: update, scopeIds: scopeIds }),
		).catch(() => {
			updateMembers(
				members.map((m) => {
					if (m.id === member.id) {
						return member;
					}
					return m;
				}),
			);
		});
	};

	const removeMember = async (member) => {
		const previousMembers = [...members];
		updateMembers(members.filter((m) => m.id !== member.id));
		return pendingPromise(api.removeMember({ member: member, scopeIds: scopeIds })).catch(() =>
			updateMembers(previousMembers),
		);
	};

	return {
		addMember: addMember,
		updateMember: updateMember,
		removeMember: removeMember,
		membersByType: membersByType,
	};
};

export const useMembersState = ({ initialMembers }) => {
	const [members, setMembers] = useState(initialMembers);
	const actions = useMembers({ members: members, updateMembers: setMembers });
	return { ...actions, members: members };
};
