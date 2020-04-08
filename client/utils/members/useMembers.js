import { useState } from 'react';

import { usePageContext, usePendingChanges } from 'utils/hooks';
import * as api from 'utils/members/api';

export const useMembers = ({ members, setMembers }) => {
	const { scopeData } = usePageContext();
	const { pendingPromise } = usePendingChanges();
	const scopeIds = scopeData.elements.activeIds;

	const addMember = (user) => {
		pendingPromise(api.addMember({ scopeIds: scopeIds, user: user })).then((member) =>
			setMembers([...members, member]),
		);
	};

	const updateMember = (member, update) => {
		setMembers(
			members.map((m) => {
				if (m.id === member.id) {
					return { ...m, ...update };
				}
				return m;
			}),
		);
		pendingPromise(
			api.updateMember({ member: member, update: update, scopeIds: scopeIds }),
		).catch(() => {
			setMembers(
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
		setMembers(members.filter((m) => m.id !== member.id));
		pendingPromise(api.removeMember({ member: member, scopeIds: scopeIds })).catch(() =>
			setMembers(previousMembers),
		);
	};

	return { addMember: addMember, updateMember: updateMember, removeMember: removeMember };
};

export const useMembersState = (initialMembers) => {
	const [members, setMembers] = useState(initialMembers);
	const actions = useMembers({ members: members, setMembers: setMembers });
	return { ...actions, members: members };
};
