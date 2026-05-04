import React, { useCallback, useMemo, useState } from 'react';

import {
	Button,
	Classes,
	ControlGroup,
	Dialog,
	FormGroup,
	InputGroup,
	NonIdealState,
	Switch,
	Tag,
	TextArea,
} from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { slugifyString } from 'utils/strings';

import './hubs.scss';

type OrgSummary = {
	id: string;
	slug: string;
	title: string;
	description: string | null;
	avatar: string | null;
	communityCount: number;
	isActive?: boolean;
	isPrivate?: boolean;
};

type OrgDetail = {
	id: string;
	slug: string;
	title: string;
	subtitle: string | null;
	description: string | null;
	avatar: string | null;
	heroImage: string | null;
	heroLogo: string | null;
	accentColorLight: string | null;
	accentColorDark: string | null;
	website: string | null;
	email: string | null;
	communityCreationEnabled: boolean;
	isActive: boolean;
	isPrivate: boolean;
	domains: string[];
	pubSearchTerms: string[];
};

type Props = {
	hubs: OrgSummary[];
};

const Hubs = (props: Props) => {
	const [hubs, setHubs] = useState<OrgSummary[]>(props.hubs);
	const [selectedOrg, setSelectedOrg] = useState<OrgDetail | null>(null);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [filterText, setFilterText] = useState('');

	// Create form state
	const [createSlug, setCreateSlug] = useState('');
	const [createTitle, setCreateTitle] = useState('');
	const [createDescription, setCreateDescription] = useState('');

	// Edit form state (superadmin-only fields)
	const [editSlug, setEditSlug] = useState('');
	const [editIsActive, setEditIsActive] = useState(false);
	const [editIsPrivate, setEditIsPrivate] = useState(false);

	// Add domain state
	const [addDomainValue, setAddDomainValue] = useState('');

	// Add pub search term state
	const [addPubSearchTermValue, setAddPubSearchTermValue] = useState('');

	const filteredOrgs = useMemo(() => {
		if (!filterText.trim()) return hubs;
		const q = filterText.toLowerCase();
		return hubs.filter(
			(o) =>
				o.title.toLowerCase().includes(q) ||
				o.slug.toLowerCase().includes(q) ||
				(o.description && o.description.toLowerCase().includes(q)),
		);
	}, [hubs, filterText]);

	const refreshOrgs = useCallback(async () => {
		const orgs = await apiFetch.get('/api/hubs');
		setHubs(orgs as any);
	}, []);

	const selectOrg = useCallback(async (orgId: string) => {
		setIsLoading(true);
		try {
			const org = await apiFetch.get(`/api/hubs/${orgId}`);
			const o = org as any as OrgDetail;
			setEditSlug(o.slug);
			setEditIsActive(o.isActive);
			setEditIsPrivate(o.isPrivate);
			setSelectedOrg(o);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleCreate = useCallback(async () => {
		setIsLoading(true);
		try {
			await apiFetch.post('/api/hubs', {
				slug: createSlug,
				title: createTitle,
				description: createDescription || null,
			});
			setIsCreateOpen(false);
			setCreateSlug('');
			setCreateTitle('');
			setCreateDescription('');
			await refreshOrgs();
		} finally {
			setIsLoading(false);
		}
	}, [createSlug, createTitle, createDescription, refreshOrgs]);

	const handleSave = useCallback(async () => {
		if (!selectedOrg) return;
		setIsLoading(true);
		try {
			await apiFetch.put(`/api/hubs/${selectedOrg.id}`, {
				slug: editSlug,
				isActive: editIsActive,
				isPrivate: editIsPrivate,
			});
			await refreshOrgs();
			await selectOrg(selectedOrg.id);
		} finally {
			setIsLoading(false);
		}
	}, [selectedOrg, editSlug, editIsActive, editIsPrivate, refreshOrgs, selectOrg]);

	const handleDelete = useCallback(async () => {
		if (!selectedOrg) return;
		// biome-ignore lint/suspicious: superadmin destructive action confirmation
		if (!window.confirm(`Delete "${selectedOrg.title}"? This cannot be undone.`)) return;
		setIsLoading(true);
		try {
			await apiFetch.delete(`/api/hubs/${selectedOrg.id}`);
			setSelectedOrg(null);
			await refreshOrgs();
		} finally {
			setIsLoading(false);
		}
	}, [selectedOrg, refreshOrgs]);

	const handleAddDomain = useCallback(async () => {
		if (!selectedOrg || !addDomainValue) return;
		const domain = addDomainValue.toLowerCase().trim();
		if (!domain) return;
		const newDomains = [...new Set([...(selectedOrg.domains || []), domain])];
		const updated = (await apiFetch.put(`/api/hubs/${selectedOrg.id}`, {
			domains: newDomains,
		})) as any as OrgDetail;
		setSelectedOrg(updated);
		setAddDomainValue('');
	}, [selectedOrg, addDomainValue]);

	const handleRemoveDomain = useCallback(
		async (domain: string) => {
			if (!selectedOrg) return;
			const newDomains = (selectedOrg.domains || []).filter((d) => d !== domain);
			const updated = (await apiFetch.put(`/api/hubs/${selectedOrg.id}`, {
				domains: newDomains,
			})) as any as OrgDetail;
			setSelectedOrg(updated);
		},
		[selectedOrg],
	);

	const handleAddPubSearchTerm = useCallback(async () => {
		if (!selectedOrg || !addPubSearchTermValue) return;
		const term = addPubSearchTermValue.trim();
		if (!term) return;
		const newTerms = [...new Set([...(selectedOrg.pubSearchTerms || []), term])];
		const updated = (await apiFetch.put(`/api/hubs/${selectedOrg.id}`, {
			pubSearchTerms: newTerms,
		})) as any as OrgDetail;
		setSelectedOrg(updated);
		setAddPubSearchTermValue('');
	}, [selectedOrg, addPubSearchTermValue]);

	const handleRemovePubSearchTerm = useCallback(
		async (term: string) => {
			if (!selectedOrg) return;
			const newTerms = (selectedOrg.pubSearchTerms || []).filter((t) => t !== term);
			const updated = (await apiFetch.put(`/api/hubs/${selectedOrg.id}`, {
				pubSearchTerms: newTerms,
			})) as any as OrgDetail;
			setSelectedOrg(updated);
		},
		[selectedOrg],
	);

	return (
		<div className="hubs-admin-component">
			{/* Create Dialog */}
			<Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Hub">
				<div className={Classes.DIALOG_BODY}>
					<FormGroup label="Title" labelInfo="(required)">
						<InputGroup
							value={createTitle}
							onChange={(e) => {
								setCreateTitle(e.target.value);
								setCreateSlug(slugifyString(e.target.value));
							}}
							placeholder="e.g. MIT Libraries"
						/>
					</FormGroup>
					<FormGroup label="Slug" labelInfo="(URL path)">
						<InputGroup
							value={createSlug}
							onChange={(e) => setCreateSlug(slugifyString(e.target.value))}
							placeholder="e.g. mit-libraries"
						/>
						<div className="slug-preview">pubpub.org/hub/{createSlug || '[slug]'}</div>
					</FormGroup>
					<FormGroup label="Description">
						<TextArea
							fill
							value={createDescription}
							onChange={(e) => setCreateDescription(e.target.value)}
							placeholder="Brief description..."
						/>
					</FormGroup>
				</div>
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<Button onClick={() => setIsCreateOpen(false)} text="Cancel" />
						<Button
							intent="primary"
							text="Create"
							loading={isLoading}
							disabled={!createSlug || !createTitle}
							onClick={handleCreate}
						/>
					</div>
				</div>
			</Dialog>

			{/* Page header */}
			<div className="orgs-page-header">
				<h2>Hubs</h2>
			</div>

			<div className="orgs-layout">
				{/* ── Left sidebar ── */}
				<div className="orgs-sidebar">
					<div className="sidebar-toolbar">
						<InputGroup
							small
							leftIcon="search"
							placeholder="Filter hubs..."
							value={filterText}
							onChange={(e) => setFilterText(e.target.value)}
						/>
						<Button
							small
							intent="primary"
							icon="plus"
							onClick={() => setIsCreateOpen(true)}
						/>
					</div>
					<div className="sidebar-list">
						{filteredOrgs.length === 0 && (
							<div className="sidebar-empty">
								{filterText ? 'No matches' : 'No hubs'}
							</div>
						)}
						{filteredOrgs.map((org) => (
							<div
								key={org.id}
								className={`org-row${selectedOrg?.id === org.id ? ' selected' : ''}`}
								onClick={() => selectOrg(org.id)}
								role="button"
								tabIndex={0}
							>
								<div className="org-row-top">
									<span className="org-row-title">{org.title}</span>
									<span className="org-row-badges">
										<Tag
											minimal
											intent={org.isActive ? 'success' : 'danger'}
											className="org-badge"
										>
											{org.isActive ? 'Active' : 'Inactive'}
										</Tag>
										{org.isPrivate && (
											<Tag minimal intent="warning" className="org-badge">
												Private
											</Tag>
										)}
									</span>
								</div>
								<div className="org-row-meta">
									{org.slug} &middot; {org.communityCount}{' '}
									{org.communityCount === 1 ? 'community' : 'communities'}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* ── Right detail ── */}
				<div className="org-detail">
					{!selectedOrg && (
						<NonIdealState
							icon="office"
							title="Select an hub"
							description="Pick one at left, or create a new one."
						/>
					)}
					{selectedOrg && (
						<>
							{/* Top bar: title + links */}
							<div className="detail-topbar">
								<div className="detail-title-row">
									<h3 className="detail-title">{selectedOrg.title}</h3>
									<span className="detail-slug">/hub/{editSlug}</span>
								</div>
								<div className="detail-links">
									<a
										href={`/hub/${editSlug}`}
										target="_blank"
										rel="noopener noreferrer"
									>
										Landing Page
									</a>
									<span className="detail-link-sep">&middot;</span>
									<a
										href={`/hub/${editSlug}/data`}
										target="_blank"
										rel="noopener noreferrer"
									>
										Data Dashboard
									</a>
									<span className="detail-link-sep">&middot;</span>
									<Button
										small
										minimal
										intent="danger"
										icon="trash"
										text="Delete"
										onClick={handleDelete}
									/>
								</div>
							</div>

							{/* Status + Slug */}
							<div className="detail-section">
								<div className="section-label">Status</div>
								<div className="status-row">
									<Switch
										checked={editIsActive}
										label="Active"
										onChange={() => setEditIsActive(!editIsActive)}
										alignIndicator="right"
										inline
									/>
									<Switch
										checked={editIsPrivate}
										label="Private"
										onChange={() => setEditIsPrivate(!editIsPrivate)}
										alignIndicator="right"
										inline
									/>
								</div>
								<p className="section-help">
									<strong>Active</strong>: org page and dashboard visible to
									managers. <br />
									<strong>Private</strong>: hidden from the /hubs directory and
									landing page. Only superadmins and hub managers can view.
								</p>
							</div>

							<div className="detail-section">
								<div className="section-label">Slug</div>
								<InputGroup
									small
									value={editSlug}
									onChange={(e) => setEditSlug(slugifyString(e.target.value))}
									className="slug-input"
								/>
								<div className="slug-preview">
									pubpub.org/hub/{editSlug || '[slug]'}
								</div>
							</div>

							<div className="save-section">
								<Button
									small
									intent="primary"
									text="Save Changes"
									loading={isLoading}
									onClick={handleSave}
								/>
							</div>

							{/* Domains */}
							<div className="detail-section">
								<div className="section-label">Email Domains</div>
								<p className="section-help">
									Email domains used for &ldquo;Suggested Communities&rdquo;
									discovery. Communities with managers or authors matching these
									TLDs (e.g. <code>mit.edu</code>, <code>ox.ac.uk</code>) will
									appear as suggestions in the org dashboard.
								</p>
								<ControlGroup className="domain-add">
									<InputGroup
										small
										placeholder="e.g. mit.edu"
										value={addDomainValue}
										onChange={(e) => setAddDomainValue(e.target.value)}
										onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
									/>
									<Button
										small
										intent="primary"
										icon="plus"
										onClick={handleAddDomain}
										disabled={!addDomainValue}
									/>
								</ControlGroup>
								<div className="domain-tags">
									{(selectedOrg?.domains || []).map((dom) => (
										<Tag
											key={dom}
											minimal
											round
											onRemove={() => handleRemoveDomain(dom)}
										>
											{dom}
										</Tag>
									))}
									{(selectedOrg?.domains || []).length === 0 && (
										<span className="no-items">None yet</span>
									)}
								</div>
							</div>

							{/* Pub Search Terms */}
							<div className="detail-section">
								<div className="section-label">Pub Search Terms</div>
								<p className="section-help">
									Phrases used for &ldquo;Suggested Pubs&rdquo; discovery. Pubs
									matching these terms (via full-text search of title,
									description, byline, and content) will appear as suggestions in
									the hub dashboard.
								</p>
								<ControlGroup className="domain-add">
									<InputGroup
										small
										placeholder="e.g. Gates Foundation"
										value={addPubSearchTermValue}
										onChange={(e) => setAddPubSearchTermValue(e.target.value)}
										onKeyDown={(e) =>
											e.key === 'Enter' && handleAddPubSearchTerm()
										}
									/>
									<Button
										small
										intent="primary"
										icon="plus"
										onClick={handleAddPubSearchTerm}
										disabled={!addPubSearchTermValue}
									/>
								</ControlGroup>
								<div className="domain-tags">
									{(selectedOrg?.pubSearchTerms || []).map((term) => (
										<Tag
											key={term}
											minimal
											round
											onRemove={() => handleRemovePubSearchTerm(term)}
										>
											{term}
										</Tag>
									))}
									{(selectedOrg?.pubSearchTerms || []).length === 0 && (
										<span className="no-items">None yet</span>
									)}
								</div>
							</div>

							{/* Note about dashboard */}
							<div className="detail-note">
								Branding, managers, communities, and other settings are managed from
								the{' '}
								<a
									href={`/hub/${editSlug}/data`}
									target="_blank"
									rel="noopener noreferrer"
								>
									Org Dashboard Settings tab
								</a>
								.
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default Hubs;
