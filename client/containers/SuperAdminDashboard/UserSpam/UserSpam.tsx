import type { SpamUser } from './types';

import React, { useCallback, useState } from 'react';

import { Button, InputGroup, Spinner } from '@blueprintjs/core';
import { useUpdateEffect } from 'react-use';

import { OverviewSearchGroup } from 'client/containers/DashboardOverview/helpers';
import { apiFetch } from 'client/utils/apiFetch';
import { useInfiniteScroll } from 'client/utils/useInfiniteScroll';

import { filters, filtersById } from './filters';
import UserSpamEntry from './UserSpamEntry';
import { useSpamUsers } from './useSpamUsers';

import './userSpam.scss';

type Props = {
	users: SpamUser[];
	searchTerm: null | string;
};

const UserSpam = (props: Props) => {
	const { users: initialUsers, searchTerm: initialSearchTerm } = props;
	const [filter, setFilter] = useState(filtersById[initialSearchTerm ? 'recent' : 'unreviewed']);
	const [searchTerm, setSearchTerm] = useState(initialSearchTerm ?? '');
	const [addIdentifier, setAddIdentifier] = useState('');
	const [addError, setAddError] = useState<string | null>(null);
	const [addLoading, setAddLoading] = useState(false);

	const { users, isLoading, loadMoreUsers, mayLoadMoreUsers, prependUser } = useSpamUsers({
		limit: 50,
		searchTerm,
		initialUsers,
		filter,
	});

	useInfiniteScroll({
		scrollTolerance: 0,
		useDocumentElement: true,
		onRequestMoreItems: loadMoreUsers,
		enabled: mayLoadMoreUsers,
	});

	useUpdateEffect(() => {
		const nextSearchPart = searchTerm ? `?q=${searchTerm}` : '';
		window.history.replaceState({}, '', window.location.pathname + nextSearchPart);
	}, [searchTerm]);

	const handleAddUser = useCallback(async () => {
		const trimmed = addIdentifier.trim();
		if (!trimmed) return;
		setAddError(null);
		setAddLoading(true);
		try {
			const user = await apiFetch.post('/api/spamTags/addUser', { identifier: trimmed });
			prependUser(user);
			setAddIdentifier('');
		} catch (err: any) {
			const msg = err?.body?.error ?? err?.message ?? 'Failed to add user';
			setAddError(msg);
		} finally {
			setAddLoading(false);
		}
	}, [addIdentifier, prependUser]);

	return (
		<div className="user-spam-component">
			<OverviewSearchGroup
				filters={filters}
				placeholder="Search for users (name, email, slug)..."
				onUpdateSearchTerm={(t) => t === '' && setSearchTerm(t)}
				onCommitSearchTerm={setSearchTerm}
				onChooseFilter={setFilter}
				filter={filter}
				initialSearchTerm={initialSearchTerm ?? undefined}
				rightControls={isLoading && <Spinner size={20} />}
			/>
			<div className="add-user-row">
				<InputGroup
					placeholder="Add user by email, slug, or ID"
					value={addIdentifier}
					onChange={(e) => setAddIdentifier(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
					disabled={addLoading}
				/>
				<Button
					text="Add user"
					onClick={handleAddUser}
					loading={addLoading}
					disabled={!addIdentifier.trim()}
				/>
			</div>
			{addError && <p className="add-user-error">{addError}</p>}
			<div className="users">
				{users.map((user) => (
					<UserSpamEntry user={user} key={user.id} />
				))}
			</div>
		</div>
	);
};

export default UserSpam;
