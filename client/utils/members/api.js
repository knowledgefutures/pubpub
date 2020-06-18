import { apiFetch } from 'client/utils/apiFetch';

export const addMember = ({ scopeIds, user }) =>
	apiFetch('/api/members', {
		method: 'POST',
		body: JSON.stringify({
			...scopeIds,
			targetUserId: user.id,
			value: {
				permissions: 'view',
			},
		}),
	});

export const updateMember = ({ member, update, scopeIds }) =>
	apiFetch('/api/members', {
		method: 'PUT',
		body: JSON.stringify({
			...scopeIds,
			id: member.id,
			value: update,
		}),
	});

export const removeMember = ({ member, scopeIds }) =>
	apiFetch('/api/members', {
		method: 'DELETE',
		body: JSON.stringify({
			...scopeIds,
			id: member.id,
		}),
	});
