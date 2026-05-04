import type {
	CollectionDef,
	DefaultMemberDef,
	FacetOverrides,
	FooterLink,
	NavEntry,
	PageDef,
	PubDef,
} from './TemplateEditorParts';

import React, { useCallback, useMemo, useRef, useState } from 'react';

import {
	Button,
	Callout,
	Dialog,
	FormGroup,
	InputGroup,
	Popover,
	Switch,
	Tab,
	Tabs,
	TextArea,
} from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { AccentStyle, Footer, Header, ImageUpload, NavBar } from 'components';
import { slugifyString } from 'utils/strings';

import {
	buildPreviewContext,
	CollectionsEditor,
	CommunityOverridesForm,
	DefaultMembersEditor,
	FacetOverridesForm,
	FooterEditor,
	NavigationEditor,
	PagesEditor,
	StarterPubsEditor,
} from './TemplateEditorParts';

import './templateEditor.scss';

type Props = {
	templateId: string;
	isOpen: boolean;
	onClose: () => void;
	onSaved?: () => void;
	onDeleted?: () => void;
	/** If true, show the delete button */
	canDelete?: boolean;
};

const TemplateEditorDialog = ({
	templateId,
	isOpen,
	onClose,
	onSaved,
	onDeleted,
	canDelete = true,
}: Props) => {
	const [template, setTemplate] = useState<any | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [editorTab, setEditorTab] = useState<string>('general');

	const [editSlug, setEditSlug] = useState('');
	const [editTitle, setEditTitle] = useState('');
	const [editDescription, setEditDescription] = useState('');
	const [editIsActive, setEditIsActive] = useState(false);
	const [editOverrides, setEditOverrides] = useState<Record<string, any>>({});
	const [editPages, setEditPages] = useState<PageDef[]>([]);
	const [editCollections, setEditCollections] = useState<CollectionDef[]>([]);
	const [editNavigation, setEditNavigation] = useState<NavEntry[] | null>(null);
	const [editFooterLinks, setEditFooterLinks] = useState<FooterLink[]>([]);
	const [editPubs, setEditPubs] = useState<PubDef[]>([]);
	const [editDefaultMembers, setEditDefaultMembers] = useState<DefaultMemberDef[]>([]);
	const [editFacetOverrides, setEditFacetOverrides] = useState<FacetOverrides>({});
	const [editCustomCSS, setEditCustomCSS] = useState<string | null>(null);
	const [editAvatar, setEditAvatar] = useState<string | null>(null);
	const [showCloseWarning, setShowCloseWarning] = useState(false);

	// Snapshot of last-saved state for dirty detection
	const savedSnapshot = useRef<string>('');

	const currentSnapshot = useMemo(
		() =>
			JSON.stringify({
				editSlug,
				editTitle,
				editDescription,
				editIsActive,
				editAvatar,
				editOverrides,
				editPages,
				editCollections,
				editNavigation,
				editFooterLinks,
				editPubs,
				editDefaultMembers,
				editFacetOverrides,
				editCustomCSS,
			}),
		[
			editSlug,
			editTitle,
			editDescription,
			editIsActive,
			editAvatar,
			editOverrides,
			editPages,
			editCollections,
			editNavigation,
			editFooterLinks,
			editPubs,
			editDefaultMembers,
			editFacetOverrides,
			editCustomCSS,
		],
	);

	const isDirty = template !== null && currentSnapshot !== savedSnapshot.current;

	const handleClose = useCallback(() => {
		if (isDirty) {
			setShowCloseWarning(true);
		} else {
			onClose();
		}
	}, [isDirty, onClose]);

	const loadTemplate = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const t = (await apiFetch.get(`/api/communityTemplates/${templateId}`)) as any;
			setEditSlug(t.slug);
			setEditTitle(t.title);
			setEditDescription(t.description || '');
			setEditIsActive(t.isActive);
			setEditOverrides(t.communityOverrides || {});
			setEditPages(t.pages || []);
			setEditCollections(t.collections || []);
			setEditNavigation(t.navigation ?? null);
			setEditFooterLinks(t.footerLinks || []);
			setEditPubs(t.starterPubs || []);
			setEditDefaultMembers(t.defaultMembers || []);
			setEditFacetOverrides(t.facetOverrides || {});
			setEditCustomCSS(t.customCSS ?? null);
			setEditAvatar(t.avatar ?? null);
			setTemplate(t);
			setEditorTab('general');
			setShowCloseWarning(false);
			// Store snapshot from raw loaded data
			savedSnapshot.current = JSON.stringify({
				editSlug: t.slug,
				editTitle: t.title,
				editDescription: t.description || '',
				editIsActive: t.isActive,
				editAvatar: t.avatar ?? null,
				editOverrides: t.communityOverrides || {},
				editPages: t.pages || [],
				editCollections: t.collections || [],
				editNavigation: t.navigation ?? null,
				editFooterLinks: t.footerLinks || [],
				editPubs: t.starterPubs || [],
				editDefaultMembers: t.defaultMembers || [],
				editFacetOverrides: t.facetOverrides || {},
				editCustomCSS: t.customCSS ?? null,
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load template');
		} finally {
			setIsLoading(false);
		}
	}, [templateId]);

	// Load template data when dialog opens
	const handleOpening = useCallback(() => {
		loadTemplate();
	}, [loadTemplate]);

	const handleSave = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			await apiFetch.put(`/api/communityTemplates/${templateId}`, {
				slug: editSlug,
				title: editTitle,
				description: editDescription || null,
				isActive: editIsActive,
				avatar: editAvatar,
				communityOverrides: editOverrides,
				pages: editPages,
				collections: editCollections,
				navigation: editNavigation,
				footerLinks: editFooterLinks.length > 0 ? editFooterLinks : null,
				starterPubs: editPubs,
				defaultMembers: editDefaultMembers.map((m) => ({
					userId: m.userId,
					permissions: m.permissions,
					fullName: m.fullName,
					avatar: m.avatar,
				})),
				facetOverrides:
					Object.keys(editFacetOverrides).length > 0 ? editFacetOverrides : null,
				customCSS: editCustomCSS || null,
			});
			await loadTemplate();
			onSaved?.();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save');
		} finally {
			setIsLoading(false);
		}
	}, [
		templateId,
		editSlug,
		editTitle,
		editDescription,
		editIsActive,
		editAvatar,
		editOverrides,
		editPages,
		editCollections,
		editNavigation,
		editFooterLinks,
		editPubs,
		editDefaultMembers,
		editFacetOverrides,
		editCustomCSS,
		loadTemplate,
		onSaved,
	]);

	const handleDelete = useCallback(async () => {
		setIsLoading(true);
		try {
			await apiFetch.delete(`/api/communityTemplates/${templateId}`);
			setTemplate(null);
			onDeleted?.();
			onClose();
		} finally {
			setIsLoading(false);
		}
	}, [templateId, onDeleted, onClose]);

	const collectionSlugs = useMemo(
		() => editCollections.map((c) => c.slug).filter(Boolean),
		[editCollections],
	);

	const pageSlugs = useMemo(
		() => editPages.map((p) => p.slug).filter((s) => s !== undefined),
		[editPages],
	);

	const previewContext = useMemo(
		() =>
			buildPreviewContext({
				overrides: editOverrides,
				pages: editPages,
				collections: editCollections,
				navigation: editNavigation,
				footerLinks: editFooterLinks,
				title: editTitle,
			}),
		[editOverrides, editPages, editCollections, editNavigation, editFooterLinks, editTitle],
	);

	return (
		<Dialog
			isOpen={isOpen}
			onClose={handleClose}
			onOpening={handleOpening}
			className="template-editor-dialog"
			canOutsideClickClose
			canEscapeKeyClose
		>
			{error && (
				<Callout intent="danger" icon="error" style={{ margin: 16 }}>
					{error}
				</Callout>
			)}
			{template && (
				<>
					<AccentStyle
						communityData={previewContext.communityData}
						isNavHidden={!!editOverrides.hideNav}
					/>
					<div className="template-editor-header">
						<div className="template-editor-title">
							<h2>{template.title}</h2>
							{template.hub && (
								<a
									href={`/hub/${template.hub.slug}`}
									target="_blank"
									rel="noopener noreferrer"
									className="template-header-link"
								>
									Hub: {template.hub.title}
								</a>
							)}
							{template.sourceCommunity && (
								<a
									href={`https://${template.sourceCommunity.subdomain}.pubpub.org`}
									target="_blank"
									rel="noopener noreferrer"
									className="template-header-link"
								>
									Cloned from{' '}
									{template.sourceCommunity.title ||
										template.sourceCommunity.subdomain}
								</a>
							)}
						</div>
						<div className="template-editor-actions">
							{canDelete && (
								<Popover
									position="bottom"
									content={
										<div style={{ padding: 12, maxWidth: 260 }}>
											<p style={{ margin: '0 0 8px' }}>
												Delete <strong>{editTitle}</strong>? This cannot be
												undone.
											</p>
											<Button
												intent="danger"
												text="Delete"
												fill
												small
												loading={isLoading}
												onClick={handleDelete}
											/>
										</div>
									}
								>
									<Button intent="danger" icon="trash" minimal />
								</Popover>
							)}
							<Button
								intent="primary"
								icon="floppy-disk"
								onClick={handleSave}
								loading={isLoading}
								disabled={!editTitle || !editSlug}
							>
								Save Changes
							</Button>
							<Popover
								isOpen={showCloseWarning}
								onClose={() => setShowCloseWarning(false)}
								position="bottom"
								content={
									<div style={{ padding: 12, maxWidth: 260 }}>
										<p style={{ margin: '0 0 8px' }}>
											You have unsaved changes. Discard them?
										</p>
										<div style={{ display: 'flex', gap: 8 }}>
											<Button
												text="Cancel"
												small
												onClick={() => setShowCloseWarning(false)}
												style={{ flex: 1 }}
											/>
											<Button
												intent="danger"
												text="Discard"
												small
												onClick={() => {
													setShowCloseWarning(false);
													onClose();
												}}
												style={{ flex: 1 }}
											/>
										</div>
									</div>
								}
							>
								<Button icon="cross" minimal onClick={handleClose} />
							</Popover>
						</div>
					</div>
					<div className="template-editor-body">
						<Tabs
							id="template-editor-tabs"
							selectedTabId={editorTab}
							onChange={(tabId) => setEditorTab(tabId as string)}
							large
							renderActiveTabPanelOnly
						>
							<Tab
								id="general"
								title="General"
								panel={
									<div className="editor-tab-panel">
										<FormGroup label="Title" labelFor="edit-title">
											<InputGroup
												id="edit-title"
												value={editTitle}
												onChange={(e) => setEditTitle(e.target.value)}
											/>
										</FormGroup>
										<FormGroup label="Slug" labelFor="edit-slug">
											<InputGroup
												id="edit-slug"
												value={editSlug}
												onChange={(e) =>
													setEditSlug(slugifyString(e.target.value))
												}
											/>
										</FormGroup>
										<FormGroup label="Description" labelFor="edit-desc">
											<TextArea
												id="edit-desc"
												fill
												value={editDescription}
												onChange={(e) => setEditDescription(e.target.value)}
											/>
										</FormGroup>
										<FormGroup label="Template Avatar">
											<ImageUpload
												defaultImage={editAvatar}
												onNewImage={(url) => setEditAvatar(url)}
												canClear
												height={60}
												width={60}
											/>
										</FormGroup>
										<Switch
											label="Active (visible to users during community creation)"
											checked={editIsActive}
											onChange={() => setEditIsActive(!editIsActive)}
											large
										/>
										<div style={{ marginTop: 16 }}>
											<strong>{template.communityCount ?? 0}</strong>{' '}
											communities created from this template
										</div>
									</div>
								}
							/>
							<Tab
								id="appearance"
								title="Appearance"
								panel={
									<div className="editor-tab-panel">
										<CommunityOverridesForm
											overrides={editOverrides}
											onChange={setEditOverrides}
											customCSS={editCustomCSS}
											onCustomCSSChange={setEditCustomCSS}
										/>
										<div className="preview-section">
											<div className="section-label">
												Homepage Header Preview
											</div>
											<div className="preview-frame">
												<Header previewContext={previewContext} />
											</div>
										</div>
									</div>
								}
							/>
							<Tab
								id="navigation"
								title="Navigation"
								panel={
									<div className="editor-tab-panel">
										<p style={{ color: '#666', marginBottom: 12 }}>
											Define the navigation bar entries. Page and collection
											references are resolved by slug when the template is
											applied.
										</p>
										<NavigationEditor
											navigation={editNavigation}
											onChange={setEditNavigation}
											pageSlugs={pageSlugs}
											collectionSlugs={collectionSlugs}
										/>
										<div className="preview-section">
											<div className="section-label">
												Navigation Bar Preview
											</div>
											<div className="preview-frame">
												<NavBar previewContext={previewContext} />
											</div>
										</div>
									</div>
								}
							/>
							<Tab
								id="footer"
								title="Footer"
								panel={
									<div className="editor-tab-panel">
										<FooterEditor
											overrides={editOverrides}
											onOverridesChange={setEditOverrides}
											links={editFooterLinks}
											onLinksChange={setEditFooterLinks}
										/>
										<div className="preview-section">
											<div className="section-label">Footer Preview</div>
											<div className="preview-frame">
												<Footer previewContext={previewContext} />
											</div>
										</div>
									</div>
								}
							/>
							<Tab
								id="facets"
								title="Facets"
								panel={
									<div className="editor-tab-panel">
										<p style={{ color: '#666', marginBottom: 12 }}>
											Set default facet values for communities created from
											this template. Leave fields unset to use system
											defaults.
										</p>
										<FacetOverridesForm
											facetOverrides={editFacetOverrides}
											onChange={setEditFacetOverrides}
										/>
									</div>
								}
							/>
							<Tab
								id="pages"
								title={`Pages (${editPages.length})`}
								panel={
									<div className="editor-tab-panel">
										<p style={{ color: '#666', marginBottom: 12 }}>
											Define the pages that will be created when a community
											uses this template. A page with an empty slug becomes
											the home page.
										</p>
										<PagesEditor
											pages={editPages}
											onChange={setEditPages}
											allCollections={editCollections}
											templateId={templateId}
										/>
									</div>
								}
							/>
							<Tab
								id="collections"
								title={`Collections (${editCollections.length})`}
								panel={
									<div className="editor-tab-panel">
										<p style={{ color: '#666', marginBottom: 12 }}>
											Define collections to be created with the community.
										</p>
										<CollectionsEditor
											collections={editCollections}
											onChange={setEditCollections}
											allPages={editPages}
											templateId={templateId}
										/>
									</div>
								}
							/>
							<Tab
								id="pubs"
								title={`Starter Pubs (${editPubs.length})`}
								panel={
									<div className="editor-tab-panel">
										<p style={{ color: '#666', marginBottom: 12 }}>
											Define pubs to be created automatically, optionally
											linked to a collection.
										</p>
										<StarterPubsEditor
											pubs={editPubs}
											onChange={setEditPubs}
											collectionSlugs={collectionSlugs}
											templateId={templateId}
										/>
									</div>
								}
							/>
							<Tab
								id="members"
								title={`Default Members (${editDefaultMembers.length})`}
								panel={
									<div className="editor-tab-panel">
										<p style={{ color: '#666', marginBottom: 12 }}>
											Users added here will automatically become members of
											any community created from this template, with the
											specified permission level.
										</p>
										<DefaultMembersEditor
											members={editDefaultMembers}
											onChange={setEditDefaultMembers}
										/>
									</div>
								}
							/>
							<Tab
								id="import-export"
								title="Import / Export"
								panel={
									<ImportExportTab
										templateData={{
											avatar: editAvatar,
											communityOverrides: editOverrides,
											pages: editPages,
											collections: editCollections,
											navigation: editNavigation,
											footerLinks: editFooterLinks,
											starterPubs: editPubs,
											defaultMembers: editDefaultMembers,
											facetOverrides: editFacetOverrides,
											customCSS: editCustomCSS,
										}}
										onImport={(data) => {
											if (data.avatar !== undefined)
												setEditAvatar(data.avatar);
											if (data.communityOverrides)
												setEditOverrides(data.communityOverrides);
											if (data.pages) setEditPages(data.pages);
											if (data.collections)
												setEditCollections(data.collections);
											if (data.navigation !== undefined)
												setEditNavigation(data.navigation);
											if (data.footerLinks)
												setEditFooterLinks(data.footerLinks);
											if (data.starterPubs) setEditPubs(data.starterPubs);
											if (data.defaultMembers)
												setEditDefaultMembers(data.defaultMembers);
											if (data.facetOverrides !== undefined)
												setEditFacetOverrides(data.facetOverrides || {});
											if (data.customCSS !== undefined)
												setEditCustomCSS(data.customCSS);
										}}
									/>
								}
							/>
						</Tabs>
					</div>
				</>
			)}
		</Dialog>
	);
};

/** Import/Export tab: presents template config as JSON for copy/paste transfer */
const ImportExportTab = ({
	templateData,
	onImport,
}: {
	templateData: Record<string, any>;
	onImport: (data: Record<string, any>) => void;
}) => {
	const [importText, setImportText] = useState('');
	const [importError, setImportError] = useState<string | null>(null);
	const exportRef = useRef<HTMLTextAreaElement | null>(null);

	const exportJson = useMemo(() => JSON.stringify(templateData, null, 2), [templateData]);

	const handleCopy = () => {
		if (exportRef.current) {
			exportRef.current.select();
			navigator.clipboard.writeText(exportJson);
		}
	};

	const handleImport = () => {
		setImportError(null);
		try {
			const parsed = JSON.parse(importText);
			if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
				setImportError('JSON must be an object');
				return;
			}
			onImport(parsed);
			setImportText('');
		} catch {
			setImportError('Invalid JSON');
		}
	};

	return (
		<div className="editor-tab-panel">
			<h4 style={{ marginTop: 0, marginBottom: 8 }}>Export</h4>
			<p style={{ color: '#666', marginBottom: 8 }}>
				Copy this JSON to transfer the template configuration to another template.
			</p>
			<TextArea
				inputRef={(ref) => {
					exportRef.current = ref;
				}}
				readOnly
				fill
				rows={10}
				value={exportJson}
				style={{ fontFamily: 'monospace', fontSize: 12 }}
			/>
			<Button
				icon="clipboard"
				text="Copy to Clipboard"
				small
				onClick={handleCopy}
				style={{ marginTop: 8 }}
			/>

			<h4 style={{ marginTop: 24, marginBottom: 8 }}>Import</h4>
			<p style={{ color: '#666', marginBottom: 8 }}>
				Paste exported JSON here to replace this template's configuration. Click Import,
				then Save Changes to persist.
			</p>
			<TextArea
				fill
				rows={10}
				value={importText}
				onChange={(e) => setImportText(e.target.value)}
				placeholder="Paste template JSON here..."
				style={{ fontFamily: 'monospace', fontSize: 12 }}
			/>
			{importError && (
				<Callout intent="danger" icon="error" style={{ marginTop: 8 }}>
					{importError}
				</Callout>
			)}
			<Button
				icon="import"
				text="Import"
				small
				intent="primary"
				disabled={!importText.trim()}
				onClick={handleImport}
				style={{ marginTop: 8 }}
			/>
		</div>
	);
};

export default TemplateEditorDialog;
