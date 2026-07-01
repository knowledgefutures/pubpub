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

import './ftpTargets.scss';

type FtpTargetRow = {
	id: string;
	communityId: string | null;
	name: string;
	ftpType: 'sftp' | 'ftps' | null;
	port: number | null;
	host: string | null;
	filePath: string | null;
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
	ftpTargets: FtpTargetRow[];
};

const FTP_TYPE_OPTIONS = [{ label: 'SFTP', value: 'sftp' }];

const useCommunitySearch = () => {
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
				const data = await apiFetch.get<CommunityOption[]>(
					`/api/superadmin/communities/search?q=${encodeURIComponent(query)}`,
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

	const reset = useCallback(() => {
		setQuery('');
		setResults([]);
		setSelected(null);
	}, []);

	return { query, setQuery, results, selected, setSelected, reset };
};

const FtpTargets = (props: Props) => {
	const [targets, setTargets] = useState<FtpTargetRow[]>(props.ftpTargets);
	const [filterText, setFilterText] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	// Create form
	const createSearch = useCommunitySearch();
	const [createName, setCreateName] = useState('');
	const [createFtpType, setCreateFtpType] = useState<'sftp' | 'ftps'>('sftp');
	const [createPort, setCreatePort] = useState('');
	const [createHost, setCreateHost] = useState('');
	const [createFilePath, setCreateFilePath] = useState('');
	const [createUsername, setCreateUsername] = useState('');
	const [createPassword, setCreatePassword] = useState('');

	// Edit dialog — undefined means "untouched", '' means "user cleared the field"
	const [editTarget, setEditTarget] = useState<FtpTargetRow | null>(null);
	const [editName, setEditName] = useState('');
	const [editFtpType, setEditFtpType] = useState<'sftp' | 'ftps'>('sftp');
	const [editPort, setEditPort] = useState('');
	const [editHost, setEditHost] = useState('');
	const [editFilePath, setEditFilePath] = useState('');
	const [editUsername, setEditUsername] = useState<string | undefined>(undefined);
	const [editPassword, setEditPassword] = useState<string | undefined>(undefined);

	// Copy dialog
	const [copySource, setCopySource] = useState<FtpTargetRow | null>(null);
	const copySearch = useCommunitySearch();
	const [copyCredentials, setCopyCredentials] = useState(true);

	// Delete confirmation
	const [pendingDelete, setPendingDelete] = useState<FtpTargetRow | null>(null);

	const filteredTargets = useMemo(() => {
		const q = filterText.toLowerCase().trim();
		if (!q) return targets;
		return targets.filter(
			(t) =>
				(t.name ?? '').toLowerCase().includes(q) ||
				(t.host ?? '').toLowerCase().includes(q) ||
				(t.ftpType ?? '').toLowerCase().includes(q) ||
				t.communityTitle.toLowerCase().includes(q) ||
				t.communitySubdomain.toLowerCase().includes(q),
		);
	}, [targets, filterText]);

	const handleCreate = useCallback(async () => {
		if (!createSearch.selected || !createHost.trim()) {
			setError('Community and host are required.');
			return;
		}
		if (!createUsername.trim() || !createPassword) {
			setError('Username and password are required.');
			return;
		}
		setIsLoading(true);
		setError(null);
		setSuccess(null);
		try {
			const result = await apiFetch.post<FtpTargetRow>('/api/superadmin/ftp-targets', {
				communityId: createSearch.selected.id,
				name: createName.trim() || undefined,
				ftpType: createFtpType,
				port: createPort.trim() ? parseInt(createPort.trim(), 10) : undefined,
				host: createHost.trim(),
				filePath: createFilePath.trim() || undefined,
				username: createUsername.trim() || undefined,
				password: createPassword || undefined,
			});
			setTargets((prev) => [result, ...prev]);
			createSearch.reset();
			setCreateName('');
			setCreateFtpType('sftp');
			setCreatePort('');
			setCreateHost('');
			setCreateFilePath('');
			setCreateUsername('');
			setCreatePassword('');
			setSuccess(
				`FTP target${result.name ? ` "${result.name}"` : ''} created for "${result.communityTitle}" (${result.host}).`,
			);
		} catch (err: any) {
			setError(err?.error ?? err?.message ?? 'Failed to create FTP target.');
		} finally {
			setIsLoading(false);
		}
	}, [
		createSearch,
		createName,
		createFtpType,
		createPort,
		createHost,
		createFilePath,
		createUsername,
		createPassword,
	]);

	const openEdit = useCallback((target: FtpTargetRow) => {
		setEditTarget(target);
		setEditName(target.name ?? '');
		setEditFtpType((target.ftpType as 'sftp' | 'ftps') ?? 'sftp');
		setEditPort(target.port != null ? String(target.port) : '');
		setEditHost(target.host ?? '');
		setEditFilePath(target.filePath ?? '');
		setEditUsername(undefined);
		setEditPassword(undefined);
	}, []);

	const handleEdit = useCallback(async () => {
		if (!editTarget) return;
		if (!editTarget.hasCredentials && (!editUsername?.trim() || !editPassword)) {
			setError('Username and password are required.');
			return;
		}
		setIsLoading(true);
		setError(null);
		setSuccess(null);
		try {
			const body: Record<string, any> = {
				name: editName.trim(),
				ftpType: editFtpType,
				host: editHost.trim(),
				port: editPort.trim() ? parseInt(editPort.trim(), 10) : null,
				filePath: editFilePath.trim() || null,
			};
			if (editUsername !== undefined) {
				body.username = editUsername.trim();
			}
			if (editPassword !== undefined) {
				body.password = editPassword;
			}
			const result = await apiFetch.put<FtpTargetRow>(
				`/api/superadmin/ftp-targets/${editTarget.id}`,
				body,
			);
			setTargets((prev) => prev.map((t) => (t.id === editTarget.id ? result : t)));
			setEditTarget(null);
			setSuccess(`FTP target for "${result.communityTitle}" updated.`);
		} catch (err: any) {
			setError(err?.error ?? err?.message ?? 'Failed to update FTP target.');
		} finally {
			setIsLoading(false);
		}
	}, [editTarget, editName, editFtpType, editPort, editHost, editFilePath, editUsername, editPassword]);

	const handleDelete = useCallback(async (target: FtpTargetRow) => {
		setPendingDelete(null);
		setIsLoading(true);
		setError(null);
		setSuccess(null);
		try {
			await apiFetch.delete(`/api/superadmin/ftp-targets/${target.id}`);
			setTargets((prev) => prev.filter((t) => t.id !== target.id));
			setSuccess(`FTP target deleted for "${target.communityTitle}" (${target.host}).`);
		} catch (err: any) {
			setError(err?.error ?? err?.message ?? 'Failed to delete FTP target.');
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
			const result = await apiFetch.post<FtpTargetRow>(
				`/api/superadmin/ftp-targets/${copySource.id}/copy`,
				{
					communityId: copySearch.selected.id,
					copyCredentials,
				},
			);
			setTargets((prev) => [result, ...prev]);
			setCopySource(null);
			copySearch.reset();
			setCopyCredentials(true);
			setSuccess(`FTP target copied to "${result.communityTitle}" (${result.host}).`);
		} catch (err: any) {
			setError(err?.error ?? err?.message ?? 'Failed to copy FTP target.');
		} finally {
			setIsLoading(false);
		}
	}, [copySource, copySearch, copyCredentials]);

	return (
		<div className="ftp-targets-component">
			<h2>FTP Targets</h2>

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

			<h4>Create FTP Target</h4>
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
				<FormGroup label="Name" style={{ flex: 0.8 }}>
					<InputGroup
						placeholder="e.g. CLOCKSS SFTP"
						value={createName}
						onChange={(e) => setCreateName(e.target.value)}
						disabled={isLoading}
					/>
				</FormGroup>
				<FormGroup label="Type">
					<HTMLSelect
						value={createFtpType}
						onChange={(e) => setCreateFtpType(e.target.value as 'sftp' | 'ftps')}
						options={FTP_TYPE_OPTIONS}
						disabled={isLoading}
					/>
				</FormGroup>
				<FormGroup label="Host" style={{ flex: 1 }}>
					<InputGroup
						placeholder="e.g. sftp.example.com"
						value={createHost}
						onChange={(e) => setCreateHost(e.target.value)}
						disabled={isLoading}
					/>
				</FormGroup>
				<FormGroup label="Port" style={{ flex: 0.3 }}>
					<InputGroup
						placeholder="e.g. 22"
						value={createPort}
						onChange={(e) => setCreatePort(e.target.value)}
						disabled={isLoading}
					/>
				</FormGroup>
				<FormGroup label="Username" style={{ flex: 0.5 }}>
					<InputGroup
						value={createUsername}
						onChange={(e) => setCreateUsername(e.target.value)}
						disabled={isLoading}
					/>
				</FormGroup>
				<FormGroup label="Password" style={{ flex: 0.5 }}>
					<InputGroup
						type="password"
						value={createPassword}
						onChange={(e) => setCreatePassword(e.target.value)}
						disabled={isLoading}
					/>
				</FormGroup>
				<FormGroup label="File Path" style={{ flex: 0.7 }}>
					<InputGroup
						placeholder="Optional (/uploads)"
						value={createFilePath}
						onChange={(e) => setCreateFilePath(e.target.value)}
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

			<h4>Manage FTP Targets</h4>
			{targets.length === 0 ? (
				<NonIdealState
					icon="folder-shared"
					title="No FTP Targets"
					description="No FTP targets have been configured yet."
				/>
			) : (
				<>
					<div className="filter-bar">
						<InputGroup
							leftIcon="search"
							placeholder="Filter by host, type, community…"
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
								<th>Name</th>
								<th>Community</th>
								<th>Subdomain</th>
								<th>Type</th>
								<th>Host</th>
								<th>Port</th>
								<th>Credentials</th>
								<th>File Path</th>
								<th />
							</tr>
						</thead>
						<tbody>
							{filteredTargets.map((t) => (
								<tr key={t.id}>
									<td>{t.name || <span style={{ color: '#888' }}>—</span>}</td>
									<td>{t.communityTitle}</td>
									<td>
										<code>{t.communitySubdomain}</code>
									</td>
									<td>
										<Tag
											minimal
											intent={
												t.ftpType === 'ftps'
													? Intent.SUCCESS
													: Intent.PRIMARY
											}
										>
											{t.ftpType ?? '—'}
										</Tag>
									</td>
									<td>
										<code>{t.host ?? '—'}</code>
									</td>
									<td>{t.port ?? '—'}</td>
									<td>
										<span
											className={`credential-badge ${t.hasCredentials ? 'has-credentials' : 'no-credentials'}`}
										>
											{t.hasCredentials ? '🔒 Set' : 'None'}
										</span>
									</td>
									<td>
										<code>{t.filePath ?? '—'}</code>
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
										<Button
											small
											minimal
											intent={Intent.DANGER}
											icon="trash"
											title="Delete FTP target"
											onClick={() => setPendingDelete(t)}
											disabled={isLoading}
										/>
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
				title="Edit FTP Target"
			>
				<div className={Classes.DIALOG_BODY}>
					<p>
						Community: <strong>{editTarget?.communityTitle}</strong> (
						<code>{editTarget?.communitySubdomain}</code>)
					</p>
					<FormGroup label="Name" className="dialog-field">
						<InputGroup
							placeholder="e.g. CLOCKSS SFTP"
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
						/>
					</FormGroup>
					<FormGroup label="Type" className="dialog-field">
						<HTMLSelect
							value={editFtpType}
							onChange={(e) => setEditFtpType(e.target.value as 'sftp' | 'ftps')}
							options={FTP_TYPE_OPTIONS}
						/>
					</FormGroup>
					<FormGroup label="Host" className="dialog-field">
						<InputGroup
							value={editHost}
							onChange={(e) => setEditHost(e.target.value)}
						/>
					</FormGroup>
					<FormGroup label="Port" className="dialog-field">
						<InputGroup
							placeholder="Optional"
							value={editPort}
							onChange={(e) => setEditPort(e.target.value)}
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
							value={editUsername ?? ''}
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
							value={editPassword ?? ''}
							onChange={(e) => setEditPassword(e.target.value)}
						/>
					</FormGroup>
					<FormGroup label="File Path" className="dialog-field">
						<InputGroup
							placeholder="Optional"
							value={editFilePath}
							onChange={(e) => setEditFilePath(e.target.value)}
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
				title="Copy FTP Target"
			>
				<div className={Classes.DIALOG_BODY}>
					<div className="copy-source-info">
						<p>
							<strong>Source:</strong> {copySource?.communityTitle} (
							<code>{copySource?.communitySubdomain}</code>)
						</p>
						<p>
							<strong>Host:</strong> {copySource?.host ?? '—'}
						</p>
						<p>
							<strong>Type:</strong> {copySource?.ftpType ?? '—'}
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

			{/* Delete Confirmation Dialog */}
			<Dialog
				isOpen={!!pendingDelete}
				onClose={() => setPendingDelete(null)}
				title="Delete FTP Target"
				icon="warning-sign"
			>
				<div className={Classes.DIALOG_BODY}>
					<p>
						Delete the FTP target for <strong>{pendingDelete?.communityTitle}</strong> (
						<code>{pendingDelete?.host}</code>)?
					</p>
					<p>This cannot be undone.</p>
				</div>
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<Button onClick={() => setPendingDelete(null)}>Cancel</Button>
						<Button
							intent={Intent.DANGER}
							onClick={() => pendingDelete && handleDelete(pendingDelete)}
							loading={isLoading}
						>
							Delete
						</Button>
					</div>
				</div>
			</Dialog>
		</div>
	);
};

export default FtpTargets;
