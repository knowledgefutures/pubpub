import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
	Button,
	Callout,
	Checkbox,
	Classes,
	Dialog,
	FormGroup,
	HTMLSelect,
	InputGroup,
	Intent,
	MenuItem,
	NonIdealState,
	Position,
	Tag,
} from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';

import { apiFetch } from 'client/utils/apiFetch';

import './depositTargets.scss';

type DepositTargetRow = {
	id: string;
	communityId: string | null;
	doiPrefix: string | null;
	service: 'crossref' | 'datacite' | null;
	hasCredentials: boolean;
	communityTitle: string;
	communitySubdomain: string;
};

type CommunityOption = {
	id: string;
	title: string;
	subdomain: string;
};

type Props = {
	depositTargets: DepositTargetRow[];
};

const SERVICE_OPTIONS = [
	{ label: 'Crossref', value: 'crossref' },
	{ label: 'DataCite', value: 'datacite' },
];

const useCommunitySearch = (excludeWithDepositTarget: boolean) => {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<CommunityOption[]>([]);
	const [selected, setSelected] = useState<CommunityOption | null>(null);
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
				if (excludeWithDepositTarget) {
					params.set('excludeWithDepositTarget', 'true');
				}
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
	}, [query, excludeWithDepositTarget]);

	const reset = useCallback(() => {
		setQuery('');
		setResults([]);
		setSelected(null);
	}, []);

	return { query, setQuery, results, selected, setSelected, reset };
};

const DepositTargets = (props: Props) => {
	const [targets, setTargets] = useState<DepositTargetRow[]>(props.depositTargets);
	const [filterText, setFilterText] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	// Create form
	const createSearch = useCommunitySearch(true);
	const [createDoiPrefix, setCreateDoiPrefix] = useState('');
	const [createService, setCreateService] = useState<'crossref' | 'datacite'>('crossref');
	const [createUsername, setCreateUsername] = useState('');
	const [createPassword, setCreatePassword] = useState('');

	// Edit dialog
	const [editTarget, setEditTarget] = useState<DepositTargetRow | null>(null);
	const [editDoiPrefix, setEditDoiPrefix] = useState('');
	const [editService, setEditService] = useState<'crossref' | 'datacite'>('crossref');
	const [editUsername, setEditUsername] = useState('');
	const [editPassword, setEditPassword] = useState('');

	// Copy dialog
	const [copySource, setCopySource] = useState<DepositTargetRow | null>(null);
	const copySearch = useCommunitySearch(true);
	const [copyCredentials, setCopyCredentials] = useState(true);

	// Delete dialog
	const [pendingDelete, setPendingDelete] = useState<DepositTargetRow | null>(null);

	const filteredTargets = useMemo(() => {
		const q = filterText.toLowerCase().trim();
		if (!q) return targets;
		return targets.filter(
			(t) =>
				(t.doiPrefix ?? '').toLowerCase().includes(q) ||
				(t.service ?? '').toLowerCase().includes(q) ||
				t.communityTitle.toLowerCase().includes(q) ||
				t.communitySubdomain.toLowerCase().includes(q),
		);
	}, [targets, filterText]);

	const handleCreate = useCallback(async () => {
		if (!createSearch.selected || !createDoiPrefix.trim()) {
			setError('Community and DOI prefix are required.');
			return;
		}
		setIsLoading(true);
		setError(null);
		setSuccess(null);
		try {
			const result = await apiFetch.post<DepositTargetRow>(
				'/api/superadmin/deposit-targets',
				{
					communityId: createSearch.selected.id,
					doiPrefix: createDoiPrefix.trim(),
					service: createService,
					username: createUsername.trim() || undefined,
					password: createPassword || undefined,
				},
			);
			setTargets((prev) => [result, ...prev]);
			createSearch.reset();
			setCreateDoiPrefix('');
			setCreateService('crossref');
			setCreateUsername('');
			setCreatePassword('');
			setSuccess(
				`Deposit target created for "${result.communityTitle}" (${result.doiPrefix}).`,
			);
		} catch (err: any) {
			setError(err?.message || 'Failed to create deposit target.');
		} finally {
			setIsLoading(false);
		}
	}, [createSearch, createDoiPrefix, createService, createUsername, createPassword]);

	const openEdit = useCallback((target: DepositTargetRow) => {
		setEditTarget(target);
		setEditDoiPrefix(target.doiPrefix ?? '');
		setEditService((target.service as 'crossref' | 'datacite') ?? 'crossref');
		setEditUsername('');
		setEditPassword('');
	}, []);

	const handleEdit = useCallback(async () => {
		if (!editTarget) return;
		setIsLoading(true);
		setError(null);
		setSuccess(null);
		try {
			const body: Record<string, any> = {
				doiPrefix: editDoiPrefix.trim(),
				service: editService,
			};
			if (editUsername !== '') {
				body.username = editUsername.trim();
			}
			if (editPassword !== '') {
				body.password = editPassword;
			}
			const result = await apiFetch.put<DepositTargetRow>(
				`/api/superadmin/deposit-targets/${editTarget.id}`,
				body,
			);
			setTargets((prev) => prev.map((t) => (t.id === editTarget.id ? result : t)));
			setEditTarget(null);
			setSuccess(`Deposit target for "${result.communityTitle}" updated.`);
		} catch (err: any) {
			setError(err?.message || 'Failed to update deposit target.');
		} finally {
			setIsLoading(false);
		}
	}, [editTarget, editDoiPrefix, editService, editUsername, editPassword]);

	const handleClearCredentials = useCallback(async (target: DepositTargetRow) => {
		setPendingDelete(null);
		setIsLoading(true);
		setError(null);
		setSuccess(null);
		try {
			const result = await apiFetch.delete<DepositTargetRow>(
				`/api/superadmin/deposit-targets/${target.id}`,
			);
			setTargets((prev) => prev.map((t) => (t.id === target.id ? result : t)));
			setSuccess(`Credentials cleared for "${target.communityTitle}" (${target.doiPrefix}).`);
		} catch (err: any) {
			setError(err?.message || 'Failed to clear credentials.');
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleCopy = useCallback(async () => {
		if (!copySource || !copySearch.selected) {
			setError('Destination community is required.');
			return;
		}
		setIsLoading(true);
		setError(null);
		setSuccess(null);
		try {
			const result = await apiFetch.post<DepositTargetRow>(
				`/api/superadmin/deposit-targets/${copySource.id}/copy`,
				{
					communityId: copySearch.selected.id,
					copyCredentials,
				},
			);
			setTargets((prev) => [result, ...prev]);
			setCopySource(null);
			copySearch.reset();
			setCopyCredentials(true);
			setSuccess(
				`Deposit target copied to "${result.communityTitle}" (${result.doiPrefix}).`,
			);
		} catch (err: any) {
			setError(err?.message || 'Failed to copy deposit target.');
		} finally {
			setIsLoading(false);
		}
	}, [copySource, copySearch, copyCredentials]);

	return (
		<div className="deposit-targets-component">
			<h2>Deposit Targets</h2>

			{error && (
				<Callout intent={Intent.DANGER} style={{ marginBottom: 15 }}>
					{error}
				</Callout>
			)}
			{success && (
				<Callout intent={Intent.SUCCESS} style={{ marginBottom: 15 }}>
					{success}
				</Callout>
			)}

			<h4>Create Deposit Target</h4>
			<div className="add-target-form">
				<FormGroup label="Community" style={{ flex: 1 }}>
					<Suggest<CommunityOption>
						items={createSearch.results}
						query={createSearch.query}
						onQueryChange={createSearch.setQuery}
						selectedItem={createSearch.selected}
						onItemSelect={(item) => {
							createSearch.setSelected(item);
							createSearch.setQuery(item.title);
						}}
						inputValueRenderer={(item) => item.title}
						itemRenderer={(item, { handleClick, modifiers }) => (
							<MenuItem
								key={item.id}
								text={item.title}
								label={item.subdomain}
								active={modifiers.active}
								onClick={handleClick}
							/>
						)}
						noResults={
							createSearch.query.trim() ? (
								<MenuItem disabled text="No communities found" />
							) : undefined
						}
						resetOnSelect={false}
						inputProps={{
							placeholder: 'Search communities…',
							disabled: isLoading,
						}}
						popoverProps={{
							minimal: true,
							position: Position.BOTTOM_LEFT,
						}}
					/>
				</FormGroup>
				<FormGroup label="DOI Prefix" style={{ flex: 0.5 }}>
					<InputGroup
						placeholder="e.g. 10.1234"
						value={createDoiPrefix}
						onChange={(e) => setCreateDoiPrefix(e.target.value)}
						disabled={isLoading}
					/>
				</FormGroup>
				<FormGroup label="Service">
					<HTMLSelect
						value={createService}
						onChange={(e) =>
							setCreateService(e.target.value as 'crossref' | 'datacite')
						}
						options={SERVICE_OPTIONS}
						disabled={isLoading}
					/>
				</FormGroup>
				<FormGroup label="Username" style={{ flex: 0.5 }}>
					<InputGroup
						placeholder="Optional"
						value={createUsername}
						onChange={(e) => setCreateUsername(e.target.value)}
						disabled={isLoading}
					/>
				</FormGroup>
				<FormGroup label="Password" style={{ flex: 0.5 }}>
					<InputGroup
						type="password"
						placeholder="Optional"
						value={createPassword}
						onChange={(e) => setCreatePassword(e.target.value)}
						disabled={isLoading}
					/>
				</FormGroup>
				<Button
					intent={Intent.PRIMARY}
					text="Create"
					onClick={handleCreate}
					loading={isLoading}
					style={{ marginBottom: 1 }}
				/>
			</div>

			<h4>Manage Deposit Targets</h4>
			{targets.length === 0 ? (
				<NonIdealState
					icon="key"
					title="No Deposit Targets"
					description="No deposit targets have been configured yet."
				/>
			) : (
				<>
					<div className="filter-bar">
						<InputGroup
							leftIcon="search"
							placeholder="Filter by prefix, service, community…"
							value={filterText}
							onChange={(e) => setFilterText(e.target.value)}
						/>
						<span className="target-count">
							{filterText && filteredTargets.length !== targets.length
								? `Showing ${filteredTargets.length} of ${targets.length}`
								: `Total: ${targets.length}`}{' '}
							target{targets.length !== 1 ? 's' : ''}
						</span>
					</div>
					<table className="targets-table">
						<thead>
							<tr>
								<th>DOI Prefix</th>
								<th>Service</th>
								<th>Community</th>
								<th>Subdomain</th>
								<th>Credentials</th>
								<th />
							</tr>
						</thead>
						<tbody>
							{filteredTargets.map((t) => (
								<tr key={t.id}>
									<td>
										<code>{t.doiPrefix}</code>
									</td>
									<td>
										<Tag
											minimal
											intent={
												t.service === 'datacite'
													? Intent.SUCCESS
													: Intent.PRIMARY
											}
										>
											{t.service ?? 'crossref'}
										</Tag>
									</td>
									<td>{t.communityTitle}</td>
									<td>
										<code>{t.communitySubdomain}</code>
									</td>
									<td>
										<span
											className={`credential-badge ${t.hasCredentials ? 'has-credentials' : 'no-credentials'}`}
										>
											{t.hasCredentials ? '🔒 Set' : 'None'}
										</span>
									</td>
									<td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
										<Button
											small
											minimal
											icon="edit"
											onClick={() => openEdit(t)}
											disabled={isLoading}
										/>
										<Button
											small
											minimal
											icon="duplicate"
											onClick={() => setCopySource(t)}
											disabled={isLoading}
										/>
										{t.hasCredentials && (
											<Button
												small
												minimal
												intent={Intent.WARNING}
												icon="lock"
												title="Clear credentials"
												onClick={() => setPendingDelete(t)}
												disabled={isLoading}
											/>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</>
			)}

			{/* Edit Dialog */}
			<Dialog
				isOpen={!!editTarget}
				onClose={() => setEditTarget(null)}
				title="Edit Deposit Target"
			>
				<div className={Classes.DIALOG_BODY}>
					<p>
						Community: <strong>{editTarget?.communityTitle}</strong> (
						<code>{editTarget?.communitySubdomain}</code>)
					</p>
					<FormGroup label="DOI Prefix" className="dialog-field">
						<InputGroup
							value={editDoiPrefix}
							onChange={(e) => setEditDoiPrefix(e.target.value)}
						/>
					</FormGroup>
					<FormGroup label="Service" className="dialog-field">
						<HTMLSelect
							value={editService}
							onChange={(e) =>
								setEditService(e.target.value as 'crossref' | 'datacite')
							}
							options={SERVICE_OPTIONS}
						/>
					</FormGroup>
					<FormGroup
						label="Username"
						helperText={
							editTarget?.hasCredentials
								? 'Leave blank to keep existing. Set to empty to clear credentials.'
								: 'Leave blank if no credentials needed.'
						}
						className="dialog-field"
					>
						<InputGroup
							placeholder={editTarget?.hasCredentials ? '(unchanged)' : 'Optional'}
							value={editUsername}
							onChange={(e) => setEditUsername(e.target.value)}
						/>
					</FormGroup>
					<FormGroup
						label="Password"
						helperText={
							editTarget?.hasCredentials
								? 'Leave blank to keep existing password.'
								: undefined
						}
						className="dialog-field"
					>
						<InputGroup
							type="password"
							placeholder={editTarget?.hasCredentials ? '(unchanged)' : 'Optional'}
							value={editPassword}
							onChange={(e) => setEditPassword(e.target.value)}
						/>
					</FormGroup>
				</div>
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<Button onClick={() => setEditTarget(null)}>Cancel</Button>
						<Button intent={Intent.PRIMARY} onClick={handleEdit} loading={isLoading}>
							Save
						</Button>
					</div>
				</div>
			</Dialog>

			{/* Copy Dialog */}
			<Dialog
				isOpen={!!copySource}
				onClose={() => {
					setCopySource(null);
					copySearch.reset();
				}}
				title="Copy Deposit Target"
			>
				<div className={Classes.DIALOG_BODY}>
					<div className="copy-source-info">
						<p>
							<strong>Source:</strong> {copySource?.communityTitle} (
							<code>{copySource?.communitySubdomain}</code>)
						</p>
						<p>
							<strong>Prefix:</strong> {copySource?.doiPrefix}
						</p>
						<p>
							<strong>Service:</strong> {copySource?.service ?? 'crossref'}
						</p>
					</div>
					<FormGroup label="Destination Community" className="dialog-field">
						<Suggest<CommunityOption>
							items={copySearch.results}
							query={copySearch.query}
							onQueryChange={copySearch.setQuery}
							selectedItem={copySearch.selected}
							onItemSelect={(item) => {
								copySearch.setSelected(item);
								copySearch.setQuery(item.title);
							}}
							inputValueRenderer={(item) => item.title}
							itemRenderer={(item, { handleClick, modifiers }) => (
								<MenuItem
									key={item.id}
									text={item.title}
									label={item.subdomain}
									active={modifiers.active}
									onClick={handleClick}
								/>
							)}
							noResults={
								copySearch.query.trim() ? (
									<MenuItem disabled text="No communities found" />
								) : undefined
							}
							resetOnSelect={false}
							inputProps={{
								placeholder: 'Search communities…',
							}}
							popoverProps={{
								minimal: true,
								position: Position.BOTTOM_LEFT,
							}}
						/>
					</FormGroup>
					{copySource?.hasCredentials && (
						<Checkbox
							checked={copyCredentials}
							onChange={(e) =>
								setCopyCredentials((e.target as HTMLInputElement).checked)
							}
							label="Copy credentials (username & password)"
						/>
					)}
				</div>
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<Button onClick={() => setCopySource(null)}>Cancel</Button>
						<Button intent={Intent.PRIMARY} onClick={handleCopy} loading={isLoading}>
							Copy
						</Button>
					</div>
				</div>
			</Dialog>

			{/* Clear Credentials Confirmation Dialog */}
			<Dialog
				isOpen={!!pendingDelete}
				onClose={() => setPendingDelete(null)}
				title="Clear Credentials"
				icon="warning-sign"
			>
				<div className={Classes.DIALOG_BODY}>
					<p>
						Clear credentials for the deposit target on{' '}
						<strong>{pendingDelete?.communityTitle}</strong> (
						<code>{pendingDelete?.doiPrefix}</code>)?
					</p>
					<p>
						The deposit target will remain but the community will no longer be able to
						mint DOIs until new credentials are set.
					</p>
				</div>
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<Button onClick={() => setPendingDelete(null)}>Cancel</Button>
						<Button
							intent={Intent.WARNING}
							onClick={() => pendingDelete && handleClearCredentials(pendingDelete)}
							loading={isLoading}
						>
							Clear Credentials
						</Button>
					</div>
				</div>
			</Dialog>
		</div>
	);
};

export default DepositTargets;
