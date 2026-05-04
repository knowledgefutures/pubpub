import type { CommunityTemplate } from 'types';

import React, { useCallback, useEffect, useState } from 'react';

import {
	Button,
	Callout,
	Card,
	Classes,
	Dialog,
	FormGroup,
	InputGroup,
	NonIdealState,
	Popover,
	Switch,
	TextArea,
} from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { TemplateEditorDialog } from 'components/TemplateEditor';
import { slugifyString } from 'utils/strings';

type TemplateWithCount = CommunityTemplate & { communityCount?: number };

type Props = {
	hubId: string;
};

const HubTemplatesTab = ({ hubId }: Props) => {
	const [templates, setTemplates] = useState<TemplateWithCount[]>([]);
	const [initialLoading, setInitialLoading] = useState(true);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [createMode, setCreateMode] = useState<'scratch' | 'clone'>('scratch');
	const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
	const [loadingAction, setLoadingAction] = useState<string | null>(null);

	// Create form state
	const [createTitle, setCreateTitle] = useState('');
	const [createSlug, setCreateSlug] = useState('');
	const [createDescription, setCreateDescription] = useState('');

	// Clone from community state
	const [cloneCommunityUrl, setCloneCommunityUrl] = useState('');
	const [cloneWarnings, setCloneWarnings] = useState<string[]>([]);

	const fetchTemplates = useCallback(async () => {
		const result = await apiFetch.get(`/api/hubs/${hubId}/templates`);
		setTemplates(result as any);
		setInitialLoading(false);
	}, [hubId]);

	useEffect(() => {
		fetchTemplates();
	}, [fetchTemplates]);

	const handleCreate = useCallback(async () => {
		setLoadingAction('create');
		try {
			if (createMode === 'clone') {
				const result = (await apiFetch.post(`/api/hubs/${hubId}/templates/from-community`, {
					communityUrl: cloneCommunityUrl,
					slug: createSlug,
					title: createTitle,
					description: createDescription || null,
				})) as any;
				if (result._warnings?.length) {
					setCloneWarnings(result._warnings);
				}
			} else {
				await apiFetch.post(`/api/hubs/${hubId}/templates`, {
					slug: createSlug,
					title: createTitle,
					description: createDescription || null,
				});
			}
			setIsCreateOpen(false);
			setCreateTitle('');
			setCreateSlug('');
			setCreateDescription('');
			setCloneCommunityUrl('');
			setCreateMode('scratch');
			await fetchTemplates();
		} finally {
			setLoadingAction(null);
		}
	}, [
		hubId,
		createMode,
		createSlug,
		createTitle,
		createDescription,
		cloneCommunityUrl,
		fetchTemplates,
	]);

	const handleToggleActive = useCallback(
		async (template: CommunityTemplate) => {
			setLoadingAction(`toggle:${template.id}`);
			try {
				await apiFetch.put(`/api/communityTemplates/${template.id}`, {
					isActive: !template.isActive,
				});
				await fetchTemplates();
			} finally {
				setLoadingAction(null);
			}
		},
		[fetchTemplates],
	);

	const handleDelete = useCallback(
		async (templateId: string) => {
			setLoadingAction(`delete:${templateId}`);
			try {
				await apiFetch.delete(`/api/communityTemplates/${templateId}`);
				await fetchTemplates();
			} finally {
				setLoadingAction(null);
			}
		},
		[fetchTemplates],
	);

	return (
		<div>
			<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
				<h3 style={{ margin: 0 }}>Community Templates</h3>
				<div style={{ display: 'flex', gap: 8 }}>
					<Button
						icon="add"
						text="Create Template"
						intent="primary"
						onClick={() => setIsCreateOpen(true)}
					/>
				</div>
			</div>
			<p style={{ color: '#666', marginBottom: 16, maxWidth: 860 }}>
				Templates are presented to users creating new communities through this hub. They let
				you define common setups — such as default pages, layouts, navigation, collections,
				and styling — that are automatically applied when someone creates a new community.
				Active templates appear as options in the community creation flow. You can create a
				template from scratch or clone one from an existing community.
			</p>

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

			{initialLoading ? (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 860 }}>
					{Array.from({ length: 3 }, (_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
						<Card key={i} style={{ padding: '12px 16px' }}>
							<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
								<div
									className="skeleton-line"
									style={{ width: '40%', height: 16 }}
								/>
								<div
									className="skeleton-line"
									style={{ width: '25%', height: 12 }}
								/>
							</div>
						</Card>
					))}
				</div>
			) : templates.length === 0 ? (
				<NonIdealState
					title="No templates yet"
					description="Create a template to offer users a starting point when creating communities."
					icon="document"
				/>
			) : (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 860 }}>
					<div
						style={{
							display: 'flex',
							justifyContent: 'flex-end',
							padding: '0 16px',
							fontSize: 12,
							color: '#5c7080',
							fontWeight: 600,
							textTransform: 'uppercase',
							letterSpacing: '0.05em',
							paddingRight: 66,
						}}
					>
						<span>Active</span>
					</div>
					{templates.map((template) => (
						<Card
							key={template.id}
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								padding: '12px 16px',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
								{template.avatar && (
									<img
										src={template.avatar}
										alt=""
										style={{
											width: 36,
											height: 36,
											borderRadius: 4,
											objectFit: 'cover',
										}}
									/>
								)}
								<div>
									<span
										role="button"
										tabIndex={0}
										className="template-row-title"
										onClick={() => setEditingTemplateId(template.id)}
										onKeyDown={(e) => {
											if (e.key === 'Enter')
												setEditingTemplateId(template.id);
										}}
									>
										{template.title}
									</span>
									<div
										style={{
											fontSize: 12,
											color: '#999',
											display: 'flex',
											alignItems: 'center',
											gap: 6,
										}}
									>
										<span>{template.slug}</span>
										{template.communityCount != null && (
											<span style={{ opacity: 0.6 }}>
												({Number(template.communityCount)}{' '}
												{Number(template.communityCount) === 1
													? 'community'
													: 'communities'}
												)
											</span>
										)}
									</div>
									{template.description && (
										<div style={{ fontSize: 13, color: '#666' }}>
											{template.description}
										</div>
									)}
								</div>
							</div>
							<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
								<Button
									icon="edit"
									minimal
									onClick={() => setEditingTemplateId(template.id)}
									disabled={!!loadingAction}
								/>
								<Switch
									style={{ marginBottom: 0 }}
									checked={template.isActive}
									onChange={() => handleToggleActive(template)}
									innerLabel="off"
									innerLabelChecked="on"
									disabled={loadingAction === `toggle:${template.id}`}
								/>
								<Popover
									content={
										<div style={{ padding: 16, maxWidth: 260 }}>
											<p style={{ marginBottom: 12 }}>
												Delete this template? This cannot be undone.
											</p>
											<div
												style={{
													display: 'flex',
													justifyContent: 'flex-end',
													gap: 8,
												}}
											>
												<Button
													className="bp3-popover-dismiss"
													text="Cancel"
												/>
												<Button
													intent="danger"
													text="Delete"
													loading={
														loadingAction === `delete:${template.id}`
													}
													onClick={() => handleDelete(template.id)}
												/>
											</div>
										</div>
									}
								>
									<Button
										icon="trash"
										minimal
										intent="danger"
										disabled={!!loadingAction}
									/>
								</Popover>
							</div>
						</Card>
					))}
				</div>
			)}

			{/* Create Template Dialog (unified: from scratch or from community) */}
			<Dialog
				title="Create Template"
				isOpen={isCreateOpen}
				onClose={() => {
					setIsCreateOpen(false);
					setCreateMode('scratch');
					setCreateTitle('');
					setCreateSlug('');
					setCreateDescription('');
					setCloneCommunityUrl('');
				}}
				style={{ width: 520 }}
			>
				<div className={Classes.DIALOG_BODY}>
					<div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
						<Button
							active={createMode === 'scratch'}
							icon="document"
							text="From Scratch"
							onClick={() => setCreateMode('scratch')}
							style={{ flex: 1 }}
						/>
						<Button
							active={createMode === 'clone'}
							icon="duplicate"
							text="From Existing Community"
							onClick={() => setCreateMode('clone')}
							style={{ flex: 1 }}
						/>
					</div>
					{createMode === 'clone' && (
						<>
							<Callout intent="primary" icon="info-sign" style={{ marginBottom: 16 }}>
								Create a template by extracting the structure of an existing PubPub
								community — including settings, pages, collections, navigation, and
								styling. Members and publications are not copied.
							</Callout>
							<FormGroup label="Community URL" labelFor="hub-clone-url">
								<InputGroup
									id="hub-clone-url"
									placeholder="e.g. my-community.pubpub.org"
									value={cloneCommunityUrl}
									onChange={(e) => setCloneCommunityUrl(e.target.value)}
								/>
							</FormGroup>
						</>
					)}
					{createMode === 'scratch' && (
						<p style={{ color: '#5c7080', fontSize: 14, marginBottom: 12 }}>
							Start with a blank template and configure pages, layouts, navigation,
							and styling using the template editor.
						</p>
					)}
					<FormGroup label="Title" labelFor="hub-create-title">
						<InputGroup
							id="hub-create-title"
							value={createTitle}
							onChange={(e) => {
								setCreateTitle(e.target.value);
								setCreateSlug(slugifyString(e.target.value));
							}}
						/>
					</FormGroup>
					<FormGroup label="Slug" labelFor="hub-create-slug">
						<InputGroup
							id="hub-create-slug"
							value={createSlug}
							onChange={(e) => setCreateSlug(slugifyString(e.target.value))}
						/>
					</FormGroup>
					<FormGroup label="Description" labelFor="hub-create-desc">
						<TextArea
							id="hub-create-desc"
							fill
							value={createDescription}
							onChange={(e) => setCreateDescription(e.target.value)}
						/>
					</FormGroup>
				</div>
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<Button
							onClick={() => {
								setIsCreateOpen(false);
								setCreateMode('scratch');
							}}
						>
							Cancel
						</Button>
						<Button
							intent="primary"
							onClick={handleCreate}
							loading={loadingAction === 'create'}
							disabled={
								!createTitle ||
								!createSlug ||
								(createMode === 'clone' && !cloneCommunityUrl)
							}
						>
							{createMode === 'clone' ? 'Clone & Create' : 'Create'}
						</Button>
					</div>
				</div>
			</Dialog>

			{/* Template Editor */}
			{editingTemplateId && (
				<TemplateEditorDialog
					templateId={editingTemplateId}
					isOpen
					onClose={() => setEditingTemplateId(null)}
					onSaved={fetchTemplates}
					onDeleted={fetchTemplates}
				/>
			)}
		</div>
	);
};

export default HubTemplatesTab;
