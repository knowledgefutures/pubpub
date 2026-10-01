import type { CommunityOverride, FlagSummary, OverridesPayload, UserOverride } from './types';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
	Button,
	ButtonGroup,
	Callout,
	Collapse,
	Icon,
	Intent,
	MenuItem,
	Slider,
	Spinner,
	Tag,
} from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';

import { apiFetch } from 'client/utils/apiFetch';
import { Avatar, UserAutocomplete } from 'components';

import { countOverrides } from './types';

type CommunityOption = {
	id: string;
	title: string;
	subdomain: string;
};

type OverrideState = 'on' | 'off' | 'inert';

type Props = {
	flag: FlagSummary;
	totalCommunities: number;
	totalUsers: number;
	onChange: (flag: FlagSummary) => void;
	onRequestDelete: (flag: FlagSummary) => void;
};

const formatPercent = (fraction: number) => `${Math.round(fraction * 100)}%`;

const useCommunitySearch = () => {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<CommunityOption[]>([]);
	const debounceRef = useRef<ReturnType<typeof setTimeout>>();

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		if (!query.trim()) {
			setResults([]);
			return;
		}
		debounceRef.current = setTimeout(async () => {
			try {
				const params = new URLSearchParams({ q: query });
				const data = await apiFetch.get<CommunityOption[]>(
					`/api/superadmin/communities/search?${params}`,
				);
				setResults(data);
			} catch {
				setResults([]);
			}
		}, 250);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query]);

	return { query, setQuery, results, setResults };
};

const AddStateToggle = (props: {
	value: 'on' | 'off';
	onChange: (value: 'on' | 'off') => void;
}) => (
	<ButtonGroup className="add-state-toggle">
		<Button
			small
			text="Force on"
			intent={props.value === 'on' ? Intent.SUCCESS : Intent.NONE}
			active={props.value === 'on'}
			onClick={() => props.onChange('on')}
		/>
		<Button
			small
			text="Force off"
			intent={props.value === 'off' ? Intent.DANGER : Intent.NONE}
			active={props.value === 'off'}
			onClick={() => props.onChange('off')}
		/>
	</ButtonGroup>
);

const OverrideStateControl = (props: {
	enabled: boolean;
	disabled: boolean;
	onSetState: (state: OverrideState) => void;
}) => (
	<div className="override-controls">
		<ButtonGroup>
			<Button
				small
				text="On"
				intent={props.enabled ? Intent.SUCCESS : Intent.NONE}
				active={props.enabled}
				disabled={props.disabled}
				onClick={() => !props.enabled && props.onSetState('on')}
			/>
			<Button
				small
				text="Off"
				intent={!props.enabled ? Intent.DANGER : Intent.NONE}
				active={!props.enabled}
				disabled={props.disabled}
				onClick={() => props.enabled && props.onSetState('off')}
			/>
		</ButtonGroup>
		<Button
			small
			minimal
			icon="cross"
			title="Remove override"
			disabled={props.disabled}
			onClick={() => props.onSetState('inert')}
		/>
	</div>
);

const FeatureFlagCard = (props: Props) => {
	const { flag, totalCommunities, totalUsers, onChange, onRequestDelete } = props;
	const [isExpanded, setIsExpanded] = useState(false);
	const [overrides, setOverrides] = useState<OverridesPayload | null>(null);
	const [isLoadingOverrides, setIsLoadingOverrides] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Local slider values (percent) so dragging doesn't fire requests
	const [communitiesPercent, setCommunitiesPercent] = useState(
		Math.round(flag.enabledCommunitiesFraction * 100),
	);
	const [usersPercent, setUsersPercent] = useState(Math.round(flag.enabledUsersFraction * 100));

	const [communityAddState, setCommunityAddState] = useState<'on' | 'off'>('on');
	const [userAddState, setUserAddState] = useState<'on' | 'off'>('on');
	const communitySearch = useCommunitySearch();

	useEffect(() => {
		setCommunitiesPercent(Math.round(flag.enabledCommunitiesFraction * 100));
		setUsersPercent(Math.round(flag.enabledUsersFraction * 100));
	}, [flag.enabledCommunitiesFraction, flag.enabledUsersFraction]);

	const loadOverrides = useCallback(async () => {
		setIsLoadingOverrides(true);
		setError(null);
		try {
			const data = await apiFetch.get<OverridesPayload>(
				`/api/superadmin/feature-flags/${flag.id}/overrides`,
			);
			setOverrides(data);
		} catch (err: any) {
			setError(err?.message || 'Failed to load overrides.');
		} finally {
			setIsLoadingOverrides(false);
		}
	}, [flag.id]);

	const handleToggleExpand = useCallback(() => {
		setIsExpanded((prev) => {
			if (!prev && !overrides) {
				loadOverrides();
			}
			return !prev;
		});
	}, [overrides, loadOverrides]);

	const updateOverrides = useCallback(
		(next: OverridesPayload) => {
			setOverrides(next);
			onChange({ ...flag, overrides: countOverrides(next) });
		},
		[flag, onChange],
	);

	const saveFractions = useCallback(
		async (fields: { enabledCommunitiesFraction?: number; enabledUsersFraction?: number }) => {
			setIsSaving(true);
			setError(null);
			try {
				const result = await apiFetch.put<FlagSummary>(
					`/api/superadmin/feature-flags/${flag.id}`,
					fields,
				);
				onChange({ ...flag, ...result });
			} catch (err: any) {
				setError(err?.message || 'Failed to update rollout fraction.');
				setCommunitiesPercent(Math.round(flag.enabledCommunitiesFraction * 100));
				setUsersPercent(Math.round(flag.enabledUsersFraction * 100));
			} finally {
				setIsSaving(false);
			}
		},
		[flag, onChange],
	);

	const setCommunityOverride = useCallback(
		async (
			community: { id: string; title: string; subdomain: string },
			state: OverrideState,
		) => {
			if (!overrides) return;
			setIsSaving(true);
			setError(null);
			try {
				await apiFetch.put(`/api/superadmin/feature-flags/${flag.id}/community-override`, {
					communityId: community.id,
					state,
				});
				const withoutEntry = overrides.communities.filter(
					(o) => o.communityId !== community.id,
				);
				const nextCommunities: CommunityOverride[] =
					state === 'inert'
						? withoutEntry
						: [
								...withoutEntry,
								{
									communityId: community.id,
									enabled: state === 'on',
									title: community.title,
									subdomain: community.subdomain,
								},
							].sort((a, b) => a.title.localeCompare(b.title));
				updateOverrides({ ...overrides, communities: nextCommunities });
			} catch (err: any) {
				setError(err?.message || 'Failed to update community override.');
			} finally {
				setIsSaving(false);
			}
		},
		[flag.id, overrides, updateOverrides],
	);

	const setUserOverride = useCallback(
		async (
			user: {
				id: string;
				fullName: string;
				slug: string;
				avatar: string | null;
				initials: string;
			},
			state: OverrideState,
		) => {
			if (!overrides) return;
			setIsSaving(true);
			setError(null);
			try {
				await apiFetch.put(`/api/superadmin/feature-flags/${flag.id}/user-override`, {
					userId: user.id,
					state,
				});
				const withoutEntry = overrides.users.filter((o) => o.userId !== user.id);
				const nextUsers: UserOverride[] =
					state === 'inert'
						? withoutEntry
						: [
								...withoutEntry,
								{
									userId: user.id,
									enabled: state === 'on',
									fullName: user.fullName,
									slug: user.slug,
									avatar: user.avatar,
									initials: user.initials,
								},
							].sort((a, b) => a.fullName.localeCompare(b.fullName));
				updateOverrides({ ...overrides, users: nextUsers });
			} catch (err: any) {
				setError(err?.message || 'Failed to update user override.');
			} finally {
				setIsSaving(false);
			}
		},
		[flag.id, overrides, updateOverrides],
	);

	const { communitiesOn, communitiesOff, usersOn, usersOff } = flag.overrides;

	const renderSummaryTags = () => (
		<div className="summary-tags">
			{flag.enabledCommunitiesFraction > 0 && (
				<Tag minimal intent={Intent.PRIMARY} icon="office">
					{flag.enabledCommunitiesFraction >= 1
						? 'All communities'
						: `${formatPercent(flag.enabledCommunitiesFraction)} of communities`}
				</Tag>
			)}
			{flag.enabledUsersFraction > 0 && (
				<Tag minimal intent={Intent.PRIMARY} icon="person">
					{flag.enabledUsersFraction >= 1
						? 'All users'
						: `${formatPercent(flag.enabledUsersFraction)} of users`}
				</Tag>
			)}
			{communitiesOn > 0 && (
				<Tag minimal intent={Intent.SUCCESS}>
					{communitiesOn} {communitiesOn === 1 ? 'community' : 'communities'} on
				</Tag>
			)}
			{communitiesOff > 0 && (
				<Tag minimal intent={Intent.DANGER}>
					{communitiesOff} {communitiesOff === 1 ? 'community' : 'communities'} off
				</Tag>
			)}
			{usersOn > 0 && (
				<Tag minimal intent={Intent.SUCCESS}>
					{usersOn} {usersOn === 1 ? 'user' : 'users'} on
				</Tag>
			)}
			{usersOff > 0 && (
				<Tag minimal intent={Intent.DANGER}>
					{usersOff} {usersOff === 1 ? 'user' : 'users'} off
				</Tag>
			)}
			{flag.enabledCommunitiesFraction === 0 &&
				flag.enabledUsersFraction === 0 &&
				communitiesOn === 0 &&
				usersOn === 0 && (
					<Tag minimal icon="moon">
						Off for everyone
					</Tag>
				)}
		</div>
	);

	const renderRolloutSection = () => (
		<div className="rollout-section">
			<h5>Gradual rollout</h5>
			<p className="section-hint">
				Enable this flag for a fraction of all communities or users (chosen
				deterministically by UUID). Overrides below always win over these fractions.
			</p>
			<div className="rollout-sliders">
				<div className="rollout-slider">
					<div className="rollout-slider-header">
						<strong>Communities</strong>
						<ButtonGroup>
							<Button
								small
								text="None"
								disabled={isSaving}
								onClick={() => {
									setCommunitiesPercent(0);
									saveFractions({ enabledCommunitiesFraction: 0 });
								}}
							/>
							<Button
								small
								text="Enable for all"
								intent={Intent.SUCCESS}
								disabled={isSaving}
								onClick={() => {
									setCommunitiesPercent(100);
									saveFractions({ enabledCommunitiesFraction: 1 });
								}}
							/>
						</ButtonGroup>
					</div>
					<Slider
						min={0}
						max={100}
						stepSize={1}
						labelStepSize={25}
						labelRenderer={(value) => `${value}%`}
						value={communitiesPercent}
						disabled={isSaving}
						onChange={setCommunitiesPercent}
						onRelease={(value) =>
							saveFractions({ enabledCommunitiesFraction: value / 100 })
						}
					/>
					<span className="rollout-estimate">
						≈ {Math.round((communitiesPercent / 100) * totalCommunities)} of{' '}
						{totalCommunities} communities
					</span>
				</div>
				<div className="rollout-slider">
					<div className="rollout-slider-header">
						<strong>Users</strong>
						<ButtonGroup>
							<Button
								small
								text="None"
								disabled={isSaving}
								onClick={() => {
									setUsersPercent(0);
									saveFractions({ enabledUsersFraction: 0 });
								}}
							/>
							<Button
								small
								text="Enable for all"
								intent={Intent.SUCCESS}
								disabled={isSaving}
								onClick={() => {
									setUsersPercent(100);
									saveFractions({ enabledUsersFraction: 1 });
								}}
							/>
						</ButtonGroup>
					</div>
					<Slider
						min={0}
						max={100}
						stepSize={1}
						labelStepSize={25}
						labelRenderer={(value) => `${value}%`}
						value={usersPercent}
						disabled={isSaving}
						onChange={setUsersPercent}
						onRelease={(value) => saveFractions({ enabledUsersFraction: value / 100 })}
					/>
					<span className="rollout-estimate">
						≈ {Math.round((usersPercent / 100) * totalUsers)} of {totalUsers} users
					</span>
				</div>
			</div>
		</div>
	);

	const renderCommunityOverrides = () => (
		<div className="override-section">
			<h5>Community overrides ({overrides!.communities.length})</h5>
			<div className="add-override">
				<AddStateToggle value={communityAddState} onChange={setCommunityAddState} />
				<Suggest<CommunityOption>
					items={communitySearch.results}
					query={communitySearch.query}
					onQueryChange={communitySearch.setQuery}
					inputValueRenderer={() => ''}
					inputProps={{ placeholder: 'Search communities to add…' }}
					popoverProps={{ minimal: true }}
					itemRenderer={(item, { handleClick, modifiers }) => (
						<MenuItem
							key={item.id}
							text={item.title}
							label={item.subdomain}
							active={modifiers.active}
							onClick={handleClick}
						/>
					)}
					noResults={<MenuItem disabled text="No communities found" />}
					onItemSelect={(item) => {
						communitySearch.setQuery('');
						communitySearch.setResults([]);
						setCommunityOverride(item, communityAddState);
					}}
				/>
			</div>
			{overrides!.communities.length === 0 ? (
				<p className="empty-overrides">No community overrides.</p>
			) : (
				<table className="overrides-table">
					<tbody>
						{overrides!.communities.map((override) => (
							<tr key={override.communityId}>
								<td>
									<a
										href={`https://${override.subdomain}.pubpub.org`}
										target="_blank"
										rel="noopener noreferrer"
									>
										{override.title}
									</a>{' '}
									<code>{override.subdomain}</code>
								</td>
								<td className="controls-cell">
									<OverrideStateControl
										enabled={override.enabled}
										disabled={isSaving}
										onSetState={(state) =>
											setCommunityOverride(
												{
													id: override.communityId,
													title: override.title,
													subdomain: override.subdomain,
												},
												state,
											)
										}
									/>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);

	const renderUserOverrides = () => (
		<div className="override-section">
			<h5>User overrides ({overrides!.users.length})</h5>
			<div className="add-override">
				<AddStateToggle value={userAddState} onChange={setUserAddState} />
				<UserAutocomplete
					placeholder="Search users to add…"
					usedUserIds={overrides!.users.map((o) => o.userId) as any}
					onSelect={
						((user: any) => {
							if (user?.id) {
								setUserOverride(
									{
										id: user.id,
										fullName: user.fullName,
										slug: user.slug,
										avatar: user.avatar ?? null,
										initials: user.initials ?? '?',
									},
									userAddState,
								);
							}
						}) as any
					}
				/>
			</div>
			{overrides!.users.length === 0 ? (
				<p className="empty-overrides">No user overrides.</p>
			) : (
				<table className="overrides-table">
					<tbody>
						{overrides!.users.map((override) => (
							<tr key={override.userId}>
								<td>
									<div className="user-cell">
										<Avatar
											width={20}
											initials={override.initials}
											avatar={override.avatar ?? undefined}
										/>
										<a
											href={`/user/${override.slug}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											{override.fullName}
										</a>
										<code>{override.slug}</code>
									</div>
								</td>
								<td className="controls-cell">
									<OverrideStateControl
										enabled={override.enabled}
										disabled={isSaving}
										onSetState={(state) =>
											setUserOverride(
												{
													id: override.userId,
													fullName: override.fullName,
													slug: override.slug,
													avatar: override.avatar,
													initials: override.initials,
												},
												state,
											)
										}
									/>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);

	return (
		<div className="feature-flag-card">
			<button type="button" className="flag-header" onClick={handleToggleExpand}>
				<Icon icon={isExpanded ? 'chevron-down' : 'chevron-right'} />
				<code className="flag-name">{flag.name}</code>
				{renderSummaryTags()}
			</button>
			<Collapse isOpen={isExpanded}>
				<div className="flag-detail">
					{error && (
						<Callout intent={Intent.DANGER} style={{ marginBottom: 12 }}>
							{error}
						</Callout>
					)}
					{renderRolloutSection()}
					{isLoadingOverrides && <Spinner size={24} />}
					{overrides && (
						<div className="override-sections">
							{renderCommunityOverrides()}
							{renderUserOverrides()}
						</div>
					)}
					<div className="danger-zone">
						<Button
							small
							minimal
							intent={Intent.DANGER}
							icon="trash"
							text="Delete this flag"
							onClick={() => onRequestDelete(flag)}
						/>
					</div>
				</div>
			</Collapse>
		</div>
	);
};

export default FeatureFlagCard;
