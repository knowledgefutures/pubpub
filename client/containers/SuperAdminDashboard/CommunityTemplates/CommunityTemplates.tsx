import React, { useCallback, useMemo, useState } from 'react';

import {
	Button,
	Callout,
	Classes,
	Dialog,
	FormGroup,
	InputGroup,
	NonIdealState,
	Tag,
	TextArea,
} from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { TemplateEditorDialog } from 'components/TemplateEditor';
import { slugifyString } from 'utils/strings';

import './communityTemplates.scss';

type TemplateSummary = {
	id: string;
	slug: string;
	title: string;
	description: string | null;
	avatar: string | null;
	isActive: boolean;
	hubCount: number;
	communityCount: number;
	sourceCommunityId: string | null;
	sourceCommunity?: {
		id: string;
		subdomain: string;
		title: string;
		domain: string | null;
	} | null;
	hubId: string | null;
	hub?: { id: string; slug: string; title: string } | null;
	createdBy?: { id: string; fullName: string; avatar: string | null } | null;
};

type Props = {
	templates: TemplateSummary[];
};

const CommunityTemplates = (props: Props) => {
	const [templates, setTemplates] = useState<TemplateSummary[]>(props.templates);
	const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isCloneOpen, setIsCloneOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [filterText, setFilterText] = useState('');

	// Create form state
	const [createSlug, setCreateSlug] = useState('');
	const [createTitle, setCreateTitle] = useState('');
	const [createDescription, setCreateDescription] = useState('');

	// Clone from community state
	const [cloneCommunityUrl, setCloneCommunityUrl] = useState('');
	const [cloneSlug, setCloneSlug] = useState('');
	const [cloneTitle, setCloneTitle] = useState('');
	const [cloneDescription, setCloneDescription] = useState('');
	const [cloneWarnings, setCloneWarnings] = useState<string[]>([]);

	const filteredTemplates = useMemo(() => {
		if (!filterText.trim()) return templates;
		const q = filterText.toLowerCase();
		return templates.filter(
			(t) =>
				t.title.toLowerCase().includes(q) ||
				t.slug.toLowerCase().includes(q) ||
				(t.description && t.description.toLowerCase().includes(q)),
		);
	}, [templates, filterText]);

	const refreshTemplates = useCallback(async () => {
		const result = await apiFetch.get('/api/communityTemplates');
		setTemplates(result as any);
	}, []);

	const handleCreate = useCallback(async () => {
		setIsLoading(true);
		try {
			await apiFetch.post('/api/communityTemplates', {
				slug: createSlug,
				title: createTitle,
				description: createDescription || null,
			});
			setIsCreateOpen(false);
			setCreateSlug('');
			setCreateTitle('');
			setCreateDescription('');
			await refreshTemplates();
		} finally {
			setIsLoading(false);
		}
	}, [createSlug, createTitle, createDescription, refreshTemplates]);

	const handleCloneFromCommunity = useCallback(async () => {
		setIsLoading(true);
		try {
			const result = (await apiFetch.post('/api/communityTemplates/from-community', {
				communityUrl: cloneCommunityUrl,
				slug: cloneSlug,
				title: cloneTitle,
				description: cloneDescription || null,
			})) as any;
			setIsCloneOpen(false);
			setCloneCommunityUrl('');
			setCloneSlug('');
			setCloneTitle('');
			setCloneDescription('');
			await refreshTemplates();
			if (result._warnings?.length) {
				setCloneWarnings(result._warnings);
			}
		} finally {
			setIsLoading(false);
		}
	}, [cloneCommunityUrl, cloneSlug, cloneTitle, cloneDescription, refreshTemplates]);

	return (
		<div className="community-templates-admin">
			<div className="templates-toolbar">
				<InputGroup
					className="filter-input"
					leftIcon="search"
					placeholder="Filter templates..."
					value={filterText}
					onChange={(e) => setFilterText(e.target.value)}
				/>
				<div>
					<Button
						intent="primary"
						icon="add"
						text="Create Template"
						onClick={() => setIsCreateOpen(true)}
						style={{ marginRight: 8 }}
					/>
					<Button
						icon="duplicate"
						text="Clone from Community"
						onClick={() => setIsCloneOpen(true)}
					/>
				</div>
			</div>

			{cloneWarnings.length > 0 && (
				<Callout
					intent="warning"
					icon="info-sign"
					style={{ marginBottom: 16 }}
					title="Template created with notes"
				>
					<ul style={{ margin: 0, paddingLeft: 20 }}>
						{cloneWarnings.map((w) => (
							<li key={w}>{w}</li>
						))}
					</ul>
					<Button
						small
						minimal
						text="Dismiss"
						style={{ marginTop: 4 }}
						onClick={() => setCloneWarnings([])}
					/>
				</Callout>
			)}

			{filteredTemplates.length === 0 ? (
				<NonIdealState
					title="No templates yet"
					description="Create a template to get started, or clone one from an existing community."
					icon="document"
				/>
			) : (
				<table className="templates-table">
					<thead>
						<tr>
							<th />
							<th>Title</th>
							<th>Slug</th>
							<th>Hub</th>
							<th>Status</th>
							<th>Communities</th>
							<th>Source</th>
						</tr>
					</thead>
					<tbody>
						{filteredTemplates.map((t) => (
							<tr key={t.id} onClick={() => setSelectedTemplateId(t.id)}>
								<td>
									{t.avatar ? (
										<img className="template-avatar" src={t.avatar} alt="" />
									) : (
										<div className="template-avatar-placeholder">
											<span>📄</span>
										</div>
									)}
								</td>
								<td>
									<strong>{t.title}</strong>
								</td>
								<td>
									<code>{t.slug}</code>
								</td>
								<td>
									{t.hub ? (
										<Tag minimal>{t.hub.title}</Tag>
									) : (
										<Tag minimal intent="none">
											Global
										</Tag>
									)}
								</td>
								<td>
									<Tag intent={t.isActive ? 'success' : 'none'} minimal>
										{t.isActive ? 'Active' : 'Inactive'}
									</Tag>
								</td>
								<td>{t.communityCount}</td>
								<td>
									{t.sourceCommunity ? (
										<Tag minimal icon="duplicate">
											{t.sourceCommunity.title || t.sourceCommunity.subdomain}
										</Tag>
									) : (
										<Tag minimal>Manual</Tag>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}

			{/* Create Dialog */}
			<Dialog
				title="Create Template"
				isOpen={isCreateOpen}
				onClose={() => setIsCreateOpen(false)}
			>
				<div className={Classes.DIALOG_BODY}>
					<FormGroup label="Title" labelFor="create-title">
						<InputGroup
							id="create-title"
							value={createTitle}
							onChange={(e) => {
								setCreateTitle(e.target.value);
								setCreateSlug(slugifyString(e.target.value));
							}}
						/>
					</FormGroup>
					<FormGroup label="Slug" labelFor="create-slug">
						<InputGroup
							id="create-slug"
							value={createSlug}
							onChange={(e) => setCreateSlug(slugifyString(e.target.value))}
						/>
					</FormGroup>
					<FormGroup label="Description" labelFor="create-desc">
						<TextArea
							id="create-desc"
							fill
							value={createDescription}
							onChange={(e) => setCreateDescription(e.target.value)}
						/>
					</FormGroup>
				</div>
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<Button onClick={() => setIsCreateOpen(false)}>Cancel</Button>
						<Button
							intent="primary"
							onClick={handleCreate}
							loading={isLoading}
							disabled={!createTitle || !createSlug}
						>
							Create
						</Button>
					</div>
				</div>
			</Dialog>

			{/* Clone from Community Dialog */}
			<Dialog
				title="Clone Template from Community"
				isOpen={isCloneOpen}
				onClose={() => setIsCloneOpen(false)}
				className="clone-dialog"
			>
				<div className={Classes.DIALOG_BODY}>
					<Callout intent="primary" icon="info-sign" style={{ marginBottom: 16 }}>
						This will extract settings, up to 10 pages, and up to 10 collections from an
						existing community. Members and pubs are not copied.
					</Callout>
					<FormGroup label="Community URL" labelFor="clone-community-url">
						<InputGroup
							id="clone-community-url"
							placeholder="e.g. my-community.pubpub.org"
							value={cloneCommunityUrl}
							onChange={(e) => setCloneCommunityUrl(e.target.value)}
						/>
					</FormGroup>
					<FormGroup label="Template Title" labelFor="clone-title">
						<InputGroup
							id="clone-title"
							value={cloneTitle}
							onChange={(e) => {
								setCloneTitle(e.target.value);
								setCloneSlug(slugifyString(e.target.value));
							}}
						/>
					</FormGroup>
					<FormGroup label="Template Slug" labelFor="clone-slug">
						<InputGroup
							id="clone-slug"
							value={cloneSlug}
							onChange={(e) => setCloneSlug(slugifyString(e.target.value))}
						/>
					</FormGroup>
					<FormGroup label="Description" labelFor="clone-desc">
						<TextArea
							id="clone-desc"
							fill
							value={cloneDescription}
							onChange={(e) => setCloneDescription(e.target.value)}
						/>
					</FormGroup>
				</div>
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<Button onClick={() => setIsCloneOpen(false)}>Cancel</Button>
						<Button
							intent="primary"
							onClick={handleCloneFromCommunity}
							loading={isLoading}
							disabled={!cloneCommunityUrl || !cloneTitle || !cloneSlug}
						>
							Clone
						</Button>
					</div>
				</div>
			</Dialog>

			{/* Template Editor */}
			{selectedTemplateId && (
				<TemplateEditorDialog
					templateId={selectedTemplateId}
					isOpen
					onClose={() => setSelectedTemplateId(null)}
					onSaved={refreshTemplates}
					onDeleted={refreshTemplates}
				/>
			)}
		</div>
	);
};

export default CommunityTemplates;
