import React, { useCallback, useMemo, useRef, useState } from 'react';

import {
	Button,
	ButtonGroup,
	Callout,
	Card,
	FormGroup,
	HTMLSelect,
	InputGroup,
	NonIdealState,
	Popover,
	Switch,
	Tag,
	TextArea,
} from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import {
	Avatar,
	ColorInput,
	ImageUpload,
	LayoutEditor,
	MinimalEditor,
	UserAutocomplete,
} from 'components';
import { slugifyString } from 'utils/strings';

// ─── Types ───────────────────────────────────────────────────────

export type PageDef = {
	title: string;
	slug: string;
	description?: string | null;
	isPublic?: boolean;
	layout?: any[];
	isNarrowWidth?: boolean;
};

export type CollectionDef = {
	title: string;
	slug: string;
	kind: string;
	isPublic?: boolean;
	isRestricted?: boolean;
	layout?: any;
};

export type PubDef = { title: string; slug?: string; collectionSlug?: string; content?: any };

export type NavEntry =
	| { type: 'page' | 'collection'; slug: string }
	| { id: string; title: string; href: string }
	| { id: string; title: string; children: NavEntry[] };

export type FooterLink = { title: string; url: string };

export type DefaultMemberDef = {
	userId: string;
	permissions: 'view' | 'edit' | 'manage' | 'admin';
	fullName?: string;
	avatar?: string | null;
};

export type FacetOverrides = {
	CitationStyle?: Record<string, any>;
	License?: Record<string, any>;
	NodeLabels?: Record<string, any>;
	PubEdgeDisplay?: Record<string, any>;
	PubHeaderTheme?: Record<string, any>;
};

// ─── Community Overrides Form ────────────────────────────────────

type CommunityOverridesFormProps = {
	overrides: Record<string, any>;
	onChange: (overrides: Record<string, any>) => void;
	customCSS?: string | null;
	onCustomCSSChange?: (css: string | null) => void;
};

export const CommunityOverridesForm = ({
	overrides,
	onChange,
	customCSS,
	onCustomCSSChange,
}: CommunityOverridesFormProps) => {
	const update = (key: string, value: any) => {
		onChange({ ...overrides, [key]: value });
	};

	const updateButton = (
		key: 'heroPrimaryButton' | 'heroSecondaryButton',
		field: 'title' | 'url',
		value: string,
	) => {
		const current = overrides[key] || { title: '', url: '' };
		const updated = { ...current, [field]: value };
		if (!updated.title && !updated.url) {
			onChange({ ...overrides, [key]: null });
		} else {
			onChange({ ...overrides, [key]: updated });
		}
	};

	return (
		<div className="overrides-form">
			<div className="section-label">Colors</div>
			<div className="field-row">
				<span className="field-label">Dark Accent Color</span>
				<div className="field-input">
					<ColorInput
						value={overrides.accentColorDark || '#112233'}
						onChange={(val: any) => update('accentColorDark', val.hex)}
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Light Accent Color</span>
				<div className="field-input">
					<ColorInput
						value={overrides.accentColorLight || '#FFFFFF'}
						onChange={(val: any) => update('accentColorLight', val.hex)}
					/>
				</div>
			</div>

			<div className="section-label">Site Header</div>
			<div className="field-row">
				<span className="field-label">Header Logo</span>
				<div className="field-input">
					<ImageUpload
						defaultImage={overrides.headerLogo}
						onNewImage={(url) => update('headerLogo', url)}
						canClear
						height={40}
						width={150}
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Header Color</span>
				<div className="field-input">
					<ButtonGroup>
						{[
							{ value: 'light', label: 'Light Accent Color' },
							{ value: 'dark', label: 'Dark Accent Color' },
							{ value: 'custom', label: 'Custom' },
						].map((v) => (
							<Button
								key={v.value}
								active={overrides.headerColorType === v.value}
								onClick={() => update('headerColorType', v.value)}
								text={v.label}
								small
							/>
						))}
					</ButtonGroup>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Header Text Accent</span>
				<div className="field-input">
					<Switch
						checked={overrides.useHeaderTextAccent ?? false}
						onChange={() =>
							update('useHeaderTextAccent', !(overrides.useHeaderTextAccent ?? false))
						}
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Hide Site Header Logo on Homepage</span>
				<div className="field-input">
					<Switch
						checked={overrides.hideHeaderLogo ?? false}
						onChange={() =>
							update('hideHeaderLogo', !(overrides.hideHeaderLogo ?? false))
						}
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Show Navigation Bar</span>
				<div className="field-input">
					<Switch
						checked={!(overrides.hideNav ?? false)}
						onChange={() => update('hideNav', !(overrides.hideNav ?? true))}
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Show "Create Pub" Button</span>
				<div className="field-input">
					<Switch
						checked={!(overrides.hideCreatePubButton ?? false)}
						onChange={() =>
							update('hideCreatePubButton', !(overrides.hideCreatePubButton ?? true))
						}
					/>
				</div>
			</div>

			<div className="section-label">Homepage Banner</div>
			<div className="field-row">
				<span className="field-label">Use Homepage Banner</span>
				<div className="field-input">
					<Switch
						checked={!(overrides.hideHero ?? false)}
						onChange={() => update('hideHero', !(overrides.hideHero ?? true))}
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Banner Title</span>
				<div className="field-input">
					<InputGroup
						value={overrides.heroTitle ?? ''}
						onChange={(e) => update('heroTitle', e.target.value || null)}
						small
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Banner Text</span>
				<div className="field-input">
					<InputGroup
						value={overrides.heroText ?? ''}
						onChange={(e) => update('heroText', e.target.value || null)}
						small
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Banner Alignment</span>
				<div className="field-input">
					<ButtonGroup>
						<Button
							active={overrides.heroAlign === 'left'}
							onClick={() => update('heroAlign', 'left')}
							text="Left"
							small
						/>
						<Button
							active={overrides.heroAlign !== 'left'}
							onClick={() => update('heroAlign', 'center')}
							text="Center"
							small
						/>
					</ButtonGroup>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Banner Background Color</span>
				<div className="field-input">
					<ColorInput
						value={overrides.heroBackgroundColor || '#FFFFFF'}
						onChange={(val: any) => update('heroBackgroundColor', val.hex)}
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Banner Text Color</span>
				<div className="field-input">
					<ButtonGroup>
						<Button
							active={overrides.heroTextColor === '#FFFFFF'}
							onClick={() => update('heroTextColor', '#FFFFFF')}
							text="Light"
							small
						/>
						<Button
							active={overrides.heroTextColor !== '#FFFFFF'}
							onClick={() => update('heroTextColor', '#000000')}
							text="Dark"
							small
						/>
					</ButtonGroup>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Banner Logo</span>
				<div className="field-input">
					<ImageUpload
						defaultImage={overrides.heroLogo}
						onNewImage={(url) => update('heroLogo', url)}
						canClear
						height={40}
						width={100}
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Banner Background Image</span>
				<div className="field-input">
					<ImageUpload
						defaultImage={overrides.heroBackgroundImage}
						onNewImage={(url) => update('heroBackgroundImage', url)}
						canClear
						height={40}
						width={100}
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Banner Image</span>
				<div className="field-input">
					<ImageUpload
						defaultImage={overrides.heroImage}
						onNewImage={(url) => update('heroImage', url)}
						canClear
						height={40}
						width={100}
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Fade Site Header into Banner Background</span>
				<div className="field-input">
					<Switch
						checked={overrides.useHeaderGradient ?? false}
						onChange={() =>
							update('useHeaderGradient', !(overrides.useHeaderGradient ?? false))
						}
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Primary Button Text</span>
				<div className="field-input">
					<InputGroup
						value={overrides.heroPrimaryButton?.title ?? ''}
						onChange={(e) => updateButton('heroPrimaryButton', 'title', e.target.value)}
						small
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Primary Button URL</span>
				<div className="field-input">
					<InputGroup
						value={overrides.heroPrimaryButton?.url ?? ''}
						onChange={(e) => updateButton('heroPrimaryButton', 'url', e.target.value)}
						placeholder="https://..."
						small
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Secondary Button Text</span>
				<div className="field-input">
					<InputGroup
						value={overrides.heroSecondaryButton?.title ?? ''}
						onChange={(e) =>
							updateButton('heroSecondaryButton', 'title', e.target.value)
						}
						small
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Secondary Button URL</span>
				<div className="field-input">
					<InputGroup
						value={overrides.heroSecondaryButton?.url ?? ''}
						onChange={(e) => updateButton('heroSecondaryButton', 'url', e.target.value)}
						placeholder="https://..."
						small
					/>
				</div>
			</div>

			<div className="section-label">Images</div>
			<div className="field-row">
				<span className="field-label">Community Avatar</span>
				<div className="field-input">
					<ImageUpload
						defaultImage={overrides.avatar}
						onNewImage={(url) => update('avatar', url)}
						canClear
						height={40}
						width={40}
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Favicon</span>
				<div className="field-input">
					<ImageUpload
						defaultImage={overrides.favicon}
						onNewImage={(url) => update('favicon', url)}
						canClear
						height={32}
						width={32}
					/>
				</div>
			</div>

			<div className="section-label">Social</div>
			<div className="field-row">
				<span className="field-label">Social Links Location</span>
				<div className="field-input">
					<HTMLSelect
						value={overrides.socialLinksLocation ?? ''}
						onChange={(e) => update('socialLinksLocation', e.target.value || null)}
						options={[
							{ value: '', label: 'Header and Footer' },
							{ value: 'header', label: 'Header Only' },
							{ value: 'footer', label: 'Footer Only' },
						]}
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Website</span>
				<div className="field-input">
					<InputGroup
						value={overrides.website ?? ''}
						onChange={(e) => update('website', e.target.value || null)}
						placeholder="https://..."
						small
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">X (Twitter)</span>
				<div className="field-input">
					<InputGroup
						value={overrides.twitter ?? ''}
						onChange={(e) => update('twitter', e.target.value || null)}
						placeholder="https://twitter.com/handle"
						small
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Instagram</span>
				<div className="field-input">
					<InputGroup
						value={overrides.instagram ?? ''}
						onChange={(e) => update('instagram', e.target.value || null)}
						placeholder="https://instagram.com/handle"
						small
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Mastodon</span>
				<div className="field-input">
					<InputGroup
						value={overrides.mastodon ?? ''}
						onChange={(e) => update('mastodon', e.target.value || null)}
						placeholder="https://mastodon.social/@handle"
						small
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">LinkedIn</span>
				<div className="field-input">
					<InputGroup
						value={overrides.linkedin ?? ''}
						onChange={(e) => update('linkedin', e.target.value || null)}
						placeholder="https://linkedin.com/in/handle"
						small
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Bluesky</span>
				<div className="field-input">
					<InputGroup
						value={overrides.bluesky ?? ''}
						onChange={(e) => update('bluesky', e.target.value || null)}
						placeholder="https://bsky.app/profile/handle"
						small
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">GitHub</span>
				<div className="field-input">
					<InputGroup
						value={overrides.github ?? ''}
						onChange={(e) => update('github', e.target.value || null)}
						placeholder="https://github.com/handle"
						small
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Facebook</span>
				<div className="field-input">
					<InputGroup
						value={overrides.facebook ?? ''}
						onChange={(e) => update('facebook', e.target.value || null)}
						placeholder="https://facebook.com/handle"
						small
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Contact Email</span>
				<div className="field-input">
					<InputGroup
						value={overrides.email ?? ''}
						onChange={(e) => update('email', e.target.value || null)}
						placeholder="contact@example.com"
						small
					/>
				</div>
			</div>
			{onCustomCSSChange && (
				<>
					<div className="section-label">Custom CSS</div>
					<Callout intent="warning" style={{ marginBottom: 12 }}>
						<strong>Experimental:</strong> Custom CSS lets you change the look and feel
						of the community, but PubPub may make changes that could break it without
						warning.
					</Callout>
					<TextArea
						fill
						rows={6}
						style={{ fontFamily: 'monospace', fontSize: 12 }}
						placeholder="/* Custom CSS for this community */"
						value={customCSS || ''}
						onChange={(e) => onCustomCSSChange(e.target.value || null)}
					/>
				</>
			)}
		</div>
	);
};

// ─── Mock Community Data for LayoutEditor ────────────────────────

const buildMockCommunityData = (pages: PageDef[], collections: CollectionDef[]) => ({
	pages: pages
		.filter((p) => p.title || p.slug)
		.map((p, i) => ({ id: `__tpl_page_${i}__`, title: p.title || '(untitled)', slug: p.slug })),
	collections: collections
		.filter((c) => c.title || c.slug)
		.map((c, i) => ({ id: `__tpl_col_${i}__`, title: c.title || '(untitled)', slug: c.slug })),
});

// ─── Preview Context Builder ─────────────────────────────────────
//
// Builds a minimal PageContext for Header, NavBar, and Footer previews.
// Navigation entries in templates are slug-based; the preview components
// resolve by ID, so we create mock objects with deterministic IDs from slugs
// and convert slug-based nav entries to ID-based ones.

const PREVIEW_ID_PREFIX = '__tpl_preview_';

const buildMockPageObjects = (pages: PageDef[]) =>
	pages.map((p) => ({
		id: `${PREVIEW_ID_PREFIX}page_${p.slug ?? ''}__`,
		title: p.title || '(untitled)',
		slug: p.slug ?? '',
		isPublic: p.isPublic ?? true,
	}));

const buildMockCollectionObjects = (collections: CollectionDef[]) =>
	collections.map((c) => ({
		id: `${PREVIEW_ID_PREFIX}col_${c.slug}__`,
		title: c.title || '(untitled)',
		slug: c.slug,
		kind: c.kind,
		isPublic: c.isPublic ?? true,
	}));

const convertNavEntriesToIds = (
	entries: NavEntry[],
	mockPages: { id: string; slug: string }[],
	mockCollections: { id: string; slug: string }[],
): any[] =>
	entries.map((entry) => {
		if ('type' in entry && 'slug' in entry) {
			const map = entry.type === 'page' ? mockPages : mockCollections;
			const mock = map.find((m) => m.slug === entry.slug);
			return { type: entry.type, id: mock?.id ?? '' };
		}
		if ('children' in entry) {
			return {
				...entry,
				children: convertNavEntriesToIds(entry.children, mockPages, mockCollections),
			};
		}
		return entry;
	});

export const buildPreviewContext = ({
	overrides,
	pages,
	collections,
	navigation,
	footerLinks,
	title,
}: {
	overrides: Record<string, any>;
	pages: PageDef[];
	collections: CollectionDef[];
	navigation: NavEntry[] | null;
	footerLinks: FooterLink[] | null;
	title?: string;
}): any => {
	const mockPages = buildMockPageObjects(pages);
	const mockCollections = buildMockCollectionObjects(collections);

	const idNavigation = navigation
		? convertNavEntriesToIds(navigation, mockPages, mockCollections)
		: null;

	// FooterLinks are NavEntry[] in the template; convert them the same way
	const idFooterLinks = footerLinks
		? convertNavEntriesToIds(footerLinks as any, mockPages, mockCollections)
		: null;

	return {
		communityData: {
			title: title || 'Preview Community',
			subdomain: 'preview',
			domain: null,
			accentColorDark: '#112233',
			accentColorLight: '#FFFFFF',
			headerColorType: 'dark',
			...overrides,
			pages: mockPages,
			collections: mockCollections,
			navigation: idNavigation,
			footerLinks: idFooterLinks,
		},
		locationData: {
			path: '/',
			queryString: '',
			params: {},
			isBasePubPub: false,
			hostname: 'preview.pubpub.org',
		},
		loginData: {
			id: null,
			isSuperAdmin: false,
		},
	};
};

const emptyLayoutPubs = { pubsById: {}, pubIdsByBlockId: {} };

/**
 * Wrapper that buffers LayoutEditor onChange into a ref to avoid
 * infinite update loops (useLayout's useUpdateEffect depends on onChange identity).
 */
const BufferedLayoutEditor = ({
	layout,
	onLayoutChange,
	communityData,
	collection,
}: {
	layout: any[];
	onLayoutChange: (layout: any[]) => void;
	communityData: any;
	collection?: any;
}) => {
	const onChangeRef = useRef(onLayoutChange);
	onChangeRef.current = onLayoutChange;
	const stableOnChange = useCallback((newLayout: any[]) => {
		onChangeRef.current(newLayout);
	}, []);

	return (
		<LayoutEditor
			allowDuplicatePubs={false}
			onChange={stableOnChange}
			initialLayout={layout}
			initialLayoutPubsByBlock={emptyLayoutPubs as any}
			communityData={communityData}
			collection={collection}
		/>
	);
};

// ─── Page Editor ─────────────────────────────────────────────────

export const PagesEditor = ({
	pages,
	onChange,
	allCollections = [],
	templateId,
}: {
	pages: PageDef[];
	onChange: (p: PageDef[]) => void;
	allCollections?: CollectionDef[];
	templateId?: string;
}) => {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const [isImporting, setIsImporting] = useState(false);
	const [importError, setImportError] = useState<string | null>(null);
	const mockCommunity = useMemo(
		() => buildMockCommunityData(pages, allCollections),
		[pages, allCollections],
	);
	const addPage = () => {
		const newPages = [
			...pages,
			{ title: 'New Page', slug: 'new-page', description: '', isPublic: true },
		];
		onChange(newPages);
		setSelectedIndex(newPages.length - 1);
	};
	const handleImportPage = useCallback(
		async (pageUrl: string) => {
			setIsImporting(true);
			setImportError(null);
			try {
				const result = (await apiFetch.post('/api/communityTemplates/fetch-page', {
					pageUrl,
					templateId,
				})) as any;
				const newPage: PageDef = {
					title: result.title,
					slug: result.slug,
					description: result.description,
					isPublic: result.isPublic,
					layout: result.layout,
					isNarrowWidth: result.isNarrowWidth,
				};
				const updated = [...pages, newPage];
				onChange(updated);
				setSelectedIndex(updated.length - 1);
			} catch (err: any) {
				setImportError(
					(err?.message || 'Failed to import page') +
						'. Please make sure the URL entered is a page.',
				);
			} finally {
				setIsImporting(false);
			}
		},
		[pages, onChange, templateId],
	);
	const removePage = (i: number) => {
		onChange(pages.filter((_, idx) => idx !== i));
		setSelectedIndex(null);
	};
	const updatePage = (i: number, field: string, value: any) => {
		const updated = pages.map((p, idx) => (idx === i ? { ...p, [field]: value } : p));
		onChange(updated);
	};

	const selected = selectedIndex !== null ? pages[selectedIndex] : null;

	return (
		<div className="two-col-layout">
			<div className="two-col-sidebar">
				<div className="sidebar-toolbar">
					<Button icon="add" text="Add Page" small onClick={addPage} intent="primary" />
					<ImportFromUrlButton
						label="Page URL"
						helperText="e.g. https://community.pubpub.org/my-page"
						placeholder="Paste page URL"
						isImporting={isImporting}
						error={importError}
						onImport={handleImportPage}
					/>
				</div>
				<div className="sidebar-list">
					{pages.length === 0 && <div className="sidebar-empty">No pages defined</div>}
					{pages.map((page, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: dynamic list
							key={i}
							className={`sidebar-row${selectedIndex === i ? ' selected' : ''}`}
							role="button"
							tabIndex={0}
							onClick={() => setSelectedIndex(i)}
							onKeyDown={(e) => e.key === 'Enter' && setSelectedIndex(i)}
						>
							<span className="sidebar-row-title">
								{page.title || '(untitled page)'}
							</span>
							<span className="sidebar-row-meta">
								{page.slug ? `/${page.slug}` : '(home)'}
							</span>
						</div>
					))}
				</div>
			</div>
			<div className="two-col-detail">
				{!selected ? (
					<NonIdealState
						icon="document"
						title="Select a page"
						description="Choose a page from the list to edit its settings."
					/>
				) : (
					<>
						<div className="detail-topbar">
							<h3 className="detail-title">{selected.title || '(untitled page)'}</h3>
							<Button
								icon="trash"
								minimal
								intent="danger"
								onClick={() => removePage(selectedIndex!)}
							/>
						</div>
						<div className="detail-section">
							<div className="section-label">Settings</div>
							<div className="field-row">
								<span className="field-label">Title</span>
								<div className="field-input">
									<InputGroup
										value={selected.title}
										onChange={(e) =>
											updatePage(selectedIndex!, 'title', e.target.value)
										}
										small
									/>
								</div>
							</div>
							<div className="field-row">
								<span className="field-label">Slug</span>
								<div className="field-input">
									<InputGroup
										value={selected.slug}
										onChange={(e) =>
											updatePage(
												selectedIndex!,
												'slug',
												slugifyString(e.target.value),
											)
										}
										placeholder="leave empty for home"
										small
									/>
								</div>
							</div>
							<div className="field-row">
								<span className="field-label">Description</span>
								<div className="field-input">
									<InputGroup
										value={selected.description ?? ''}
										onChange={(e) =>
											updatePage(
												selectedIndex!,
												'description',
												e.target.value || null,
											)
										}
										small
									/>
								</div>
							</div>
							<div className="field-row">
								<span className="field-label">Public</span>
								<div className="field-input">
									<Switch
										checked={selected.isPublic ?? true}
										onChange={() =>
											updatePage(
												selectedIndex!,
												'isPublic',
												!(selected.isPublic ?? true),
											)
										}
									/>
								</div>
							</div>
							<div className="field-row">
								<span className="field-label">Narrow Width</span>
								<div className="field-input">
									<Switch
										checked={selected.isNarrowWidth ?? false}
										onChange={() =>
											updatePage(
												selectedIndex!,
												'isNarrowWidth',
												!(selected.isNarrowWidth ?? false),
											)
										}
									/>
								</div>
							</div>
						</div>
						<div className="detail-section">
							<div className="section-label">
								Layout ({(selected.layout || []).length} blocks)
							</div>
							<div className="layout-editor-wrapper">
								<BufferedLayoutEditor
									key={selectedIndex}
									layout={selected.layout || []}
									onLayoutChange={(newLayout) =>
										updatePage(selectedIndex!, 'layout', newLayout)
									}
									communityData={mockCommunity}
								/>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

// ─── Collection Editor ───────────────────────────────────────────

export const CollectionsEditor = ({
	collections,
	onChange,
	allPages = [],
	templateId,
}: {
	collections: CollectionDef[];
	onChange: (c: CollectionDef[]) => void;
	allPages?: PageDef[];
	templateId?: string;
}) => {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const [isImporting, setIsImporting] = useState(false);
	const [importError, setImportError] = useState<string | null>(null);
	const mockCommunity = useMemo(
		() => buildMockCommunityData(allPages, collections),
		[allPages, collections],
	);
	const addCollection = () => {
		const newCols = [
			...collections,
			{
				title: 'New Collection',
				slug: '',
				kind: 'tag' as const,
				isPublic: false,
				isRestricted: true,
			},
		];
		onChange(newCols);
		setSelectedIndex(newCols.length - 1);
	};
	const handleImportCollection = useCallback(
		async (collectionUrl: string) => {
			setIsImporting(true);
			setImportError(null);
			try {
				const result = (await apiFetch.post('/api/communityTemplates/fetch-collection', {
					collectionUrl,
					templateId,
				})) as any;
				const newCol: CollectionDef = {
					title: result.title,
					slug: result.slug,
					kind: result.kind,
					isPublic: result.isPublic,
					isRestricted: result.isRestricted,
					layout: result.layout,
				};
				const updated = [...collections, newCol];
				onChange(updated);
				setSelectedIndex(updated.length - 1);
			} catch (err: any) {
				setImportError(
					(err?.message || 'Failed to import collection') +
						'. Please make sure the URL entered is a collection.',
				);
			} finally {
				setIsImporting(false);
			}
		},
		[collections, onChange, templateId],
	);
	const removeCollection = (i: number) => {
		onChange(collections.filter((_, idx) => idx !== i));
		setSelectedIndex(null);
	};
	const updateCollection = (i: number, field: string, value: any) => {
		const updated = collections.map((c, idx) => (idx === i ? { ...c, [field]: value } : c));
		onChange(updated);
	};

	const selected = selectedIndex !== null ? collections[selectedIndex] : null;

	return (
		<div className="two-col-layout">
			<div className="two-col-sidebar">
				<div className="sidebar-toolbar">
					<Button
						icon="add"
						text="Add Collection"
						small
						onClick={addCollection}
						intent="primary"
					/>
					<ImportFromUrlButton
						label="Collection URL"
						helperText="e.g. https://community.pubpub.org/my-collection"
						placeholder="Paste collection URL"
						isImporting={isImporting}
						error={importError}
						onImport={handleImportCollection}
					/>
				</div>
				<div className="sidebar-list">
					{collections.length === 0 && (
						<div className="sidebar-empty">No collections defined</div>
					)}
					{collections.map((col, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: dynamic list
							key={i}
							className={`sidebar-row${selectedIndex === i ? ' selected' : ''}`}
							role="button"
							tabIndex={0}
							onClick={() => setSelectedIndex(i)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									setSelectedIndex(i);
								}
							}}
						>
							<span className="sidebar-row-title">
								{col.title || '(untitled collection)'}
							</span>
							<span className="sidebar-row-meta">
								{col.kind} · /{col.slug || '...'}
							</span>
						</div>
					))}
				</div>
			</div>
			<div className="two-col-detail">
				{!selected ? (
					<NonIdealState
						icon="folder-close"
						title="Select a collection"
						description="Choose a collection from the list to edit its settings."
					/>
				) : (
					<>
						<div className="detail-topbar">
							<h3 className="detail-title">
								{selected.title || '(untitled collection)'}
							</h3>
							<Button
								icon="trash"
								minimal
								intent="danger"
								onClick={() => removeCollection(selectedIndex!)}
							/>
						</div>
						<div className="detail-section">
							<div className="section-label">Settings</div>
							<div className="field-row">
								<span className="field-label">Title</span>
								<div className="field-input">
									<InputGroup
										value={selected.title}
										onChange={(e) =>
											updateCollection(
												selectedIndex!,
												'title',
												e.target.value,
											)
										}
										small
									/>
								</div>
							</div>
							<div className="field-row">
								<span className="field-label">Slug</span>
								<div className="field-input">
									<InputGroup
										value={selected.slug}
										onChange={(e) =>
											updateCollection(
												selectedIndex!,
												'slug',
												slugifyString(e.target.value),
											)
										}
										small
									/>
								</div>
							</div>
							<div className="field-row">
								<span className="field-label">Kind</span>
								<div className="field-input">
									<HTMLSelect
										value={selected.kind}
										onChange={(e) =>
											updateCollection(selectedIndex!, 'kind', e.target.value)
										}
										options={['tag', 'issue', 'book', 'conference']}
									/>
								</div>
							</div>
							<div className="field-row">
								<span className="field-label">Public</span>
								<div className="field-input">
									<Switch
										checked={selected.isPublic ?? false}
										onChange={() =>
											updateCollection(
												selectedIndex!,
												'isPublic',
												!(selected.isPublic ?? false),
											)
										}
									/>
								</div>
							</div>
							<div className="field-row">
								<span className="field-label">Restricted</span>
								<div className="field-input">
									<Switch
										checked={selected.isRestricted ?? true}
										onChange={() =>
											updateCollection(
												selectedIndex!,
												'isRestricted',
												!(selected.isRestricted ?? true),
											)
										}
									/>
								</div>
							</div>
						</div>
						<div className="detail-section">
							<div className="section-label">
								Layout ({(selected.layout?.blocks || selected.layout || []).length}{' '}
								blocks)
							</div>
							<div className="layout-editor-wrapper">
								<BufferedLayoutEditor
									key={selectedIndex}
									layout={selected.layout?.blocks || selected.layout || []}
									onLayoutChange={(newBlocks) =>
										updateCollection(selectedIndex!, 'layout', {
											blocks: newBlocks,
										})
									}
									communityData={mockCommunity}
									collection={
										{
											id: `__tpl_col_${selectedIndex}__`,
											title: selected.title,
											kind: selected.kind,
										} as any
									}
								/>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

// ─── Navigation Editor ───────────────────────────────────────────

export const NavigationEditor = ({
	navigation,
	onChange,
	pageSlugs,
	collectionSlugs,
}: {
	navigation: NavEntry[] | null;
	onChange: (n: NavEntry[] | null) => void;
	pageSlugs: string[];
	collectionSlugs: string[];
}) => {
	const entries = navigation ?? [];

	const addPageRef = () => onChange([...entries, { type: 'page', slug: pageSlugs[0] ?? '' }]);
	const addCollectionRef = () =>
		onChange([...entries, { type: 'collection', slug: collectionSlugs[0] ?? '' }]);
	const addExternalLink = () =>
		onChange([...entries, { id: crypto.randomUUID(), title: '', href: '' }]);
	const addDropdown = () =>
		onChange([...entries, { id: crypto.randomUUID(), title: '', children: [] }]);
	const removeEntry = (i: number) => onChange(entries.filter((_, idx) => idx !== i));
	const updateEntry = (i: number, updated: NavEntry) =>
		onChange(entries.map((e, idx) => (idx === i ? updated : e)));

	const moveUp = (i: number) => {
		if (i === 0) return;
		const next = [...entries];
		[next[i - 1], next[i]] = [next[i], next[i - 1]];
		onChange(next);
	};
	const moveDown = (i: number) => {
		if (i >= entries.length - 1) return;
		const next = [...entries];
		[next[i], next[i + 1]] = [next[i + 1], next[i]];
		onChange(next);
	};

	return (
		<div>
			{entries.length === 0 && (
				<Callout icon="info-sign" intent="none" style={{ marginBottom: 12 }}>
					No navigation entries. The community will use the default nav.
				</Callout>
			)}
			{entries.map((entry, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: dynamic list
				<Card key={i} className="item-card nav-entry-card" style={{ padding: '6px 10px' }}>
					<div className="nav-entry-row">
						<NavEntryLabel entry={entry} />
						<div className="nav-entry-controls">
							<NavEntryEditor
								entry={entry}
								onChange={(updated) => updateEntry(i, updated)}
								pageSlugs={pageSlugs}
								collectionSlugs={collectionSlugs}
							/>
						</div>
						<ButtonGroup minimal>
							<Button
								icon="arrow-up"
								small
								disabled={i === 0}
								onClick={() => moveUp(i)}
							/>
							<Button
								icon="arrow-down"
								small
								disabled={i >= entries.length - 1}
								onClick={() => moveDown(i)}
							/>
							<Button
								icon="trash"
								small
								intent="danger"
								onClick={() => removeEntry(i)}
							/>
						</ButtonGroup>
					</div>
				</Card>
			))}
			<div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
				<Button
					icon="document"
					text="Page"
					onClick={addPageRef}
					small
					disabled={pageSlugs.length === 0}
				/>
				<Button
					icon="folder-close"
					text="Collection"
					onClick={addCollectionRef}
					small
					disabled={collectionSlugs.length === 0}
				/>
				<Button icon="link" text="External Link" onClick={addExternalLink} small />
				<Button icon="caret-down" text="Dropdown" onClick={addDropdown} small />
			</div>
		</div>
	);
};

const NavEntryLabel = ({ entry }: { entry: NavEntry }) => {
	if ('type' in entry) {
		const icon = entry.type === 'page' ? 'document' : 'folder-close';
		return (
			<span>
				<Tag minimal icon={icon as any}>
					{entry.type}: {entry.slug || '(home)'}
				</Tag>
			</span>
		);
	}
	if ('children' in entry) {
		return <strong>Dropdown: {entry.title || '(untitled)'}</strong>;
	}
	return <strong>Link: {entry.title || '(untitled)'}</strong>;
};

const NavEntryEditor = ({
	entry,
	onChange,
	pageSlugs,
	collectionSlugs,
}: {
	entry: NavEntry;
	onChange: (e: NavEntry) => void;
	pageSlugs: string[];
	collectionSlugs: string[];
}) => {
	if ('type' in entry) {
		const options =
			entry.type === 'page'
				? [
						{ value: '', label: '(home)' },
						...pageSlugs.filter(Boolean).map((s) => ({ value: s, label: s })),
					]
				: collectionSlugs.map((s) => ({ value: s, label: s }));
		return (
			<HTMLSelect
				value={entry.slug}
				onChange={(e) => onChange({ ...entry, slug: e.target.value })}
				options={options}
			/>
		);
	}
	if ('children' in entry) {
		return (
			<div>
				<InputGroup
					value={entry.title}
					onChange={(e) => onChange({ ...entry, title: e.target.value })}
					small
					placeholder="Dropdown title"
				/>
				<div style={{ paddingLeft: 16, marginTop: 4 }}>
					<NavigationEditor
						navigation={entry.children}
						onChange={(children) => onChange({ ...entry, children: children ?? [] })}
						pageSlugs={pageSlugs}
						collectionSlugs={collectionSlugs}
					/>
				</div>
			</div>
		);
	}
	// External link
	return (
		<div style={{ display: 'flex', gap: 8, flex: 1 }}>
			<InputGroup
				value={entry.title}
				onChange={(e) => onChange({ ...entry, title: e.target.value })}
				small
				placeholder="Link title"
				style={{ flex: 1 }}
			/>
			<InputGroup
				value={entry.href}
				onChange={(e) => onChange({ ...entry, href: e.target.value })}
				placeholder="https://..."
				small
				style={{ flex: 2 }}
			/>
		</div>
	);
};

// ─── Footer Editor ───────────────────────────────────────────────

export const FooterEditor = ({
	overrides,
	onOverridesChange,
	links,
	onLinksChange,
}: {
	overrides: Record<string, any>;
	onOverridesChange: (overrides: Record<string, any>) => void;
	links: FooterLink[];
	onLinksChange: (l: FooterLink[]) => void;
}) => {
	const updateOverride = (key: string, value: any) => {
		onOverridesChange({ ...overrides, [key]: value });
	};

	const addLink = () => onLinksChange([...links, { title: '', url: '' }]);
	const removeLink = (i: number) => onLinksChange(links.filter((_, idx) => idx !== i));
	const updateLink = (i: number, field: 'title' | 'url', value: string) =>
		onLinksChange(links.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));

	return (
		<div className="overrides-form">
			<div className="section-label">Footer Settings</div>
			<div className="field-row">
				<span className="field-label">Footer Title</span>
				<div className="field-input">
					<InputGroup
						value={overrides.footerTitle ?? ''}
						onChange={(e) => updateOverride('footerTitle', e.target.value || null)}
						placeholder="Defaults to community title"
						small
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Footer Logo</span>
				<div className="field-input">
					<ImageUpload
						defaultImage={overrides.footerImage}
						onNewImage={(url) => updateOverride('footerImage', url)}
						canClear
						height={40}
						width={100}
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Footer Logo Link</span>
				<div className="field-input">
					<InputGroup
						value={overrides.footerLogoLink ?? ''}
						onChange={(e) => updateOverride('footerLogoLink', e.target.value || null)}
						placeholder="Defaults to community URL"
						small
					/>
				</div>
			</div>

			<div className="section-label" style={{ marginTop: 16 }}>
				Footer Links
			</div>
			{links.length === 0 && (
				<Callout icon="info-sign" intent="none" style={{ marginBottom: 12 }}>
					No footer links.
				</Callout>
			)}
			{links.map((link, i) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: dynamic list
					key={i}
					className="overrides-row"
					style={{ marginBottom: 8, alignItems: 'flex-end' }}
				>
					<FormGroup label="Title" style={{ flex: 1 }}>
						<InputGroup
							value={link.title}
							onChange={(e) => updateLink(i, 'title', e.target.value)}
							small
						/>
					</FormGroup>
					<FormGroup label="URL" style={{ flex: 2 }}>
						<InputGroup
							value={link.url}
							onChange={(e) => updateLink(i, 'url', e.target.value)}
							placeholder="https://..."
							small
						/>
					</FormGroup>
					<Button
						icon="trash"
						minimal
						small
						intent="danger"
						onClick={() => removeLink(i)}
						style={{ marginBottom: 15 }}
					/>
				</div>
			))}
			<Button
				icon="add"
				text="Add Footer Link"
				onClick={addLink}
				small
				style={{ marginTop: 4 }}
			/>
		</div>
	);
};

// ─── Starter Pubs Editor ─────────────────────────────────────────

export const StarterPubsEditor = ({
	pubs,
	onChange,
	collectionSlugs,
	templateId,
}: {
	pubs: PubDef[];
	onChange: (p: PubDef[]) => void;
	collectionSlugs: string[];
	templateId?: string;
}) => {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const [importError, setImportError] = useState<string | null>(null);
	const [isImporting, setIsImporting] = useState(false);
	const addPub = () => {
		const newPubs = [...pubs, { title: 'New Pub' }];
		onChange(newPubs);
		setSelectedIndex(newPubs.length - 1);
	};
	const removePub = (i: number) => {
		onChange(pubs.filter((_, idx) => idx !== i));
		setSelectedIndex(null);
	};
	const updatePub = useCallback(
		(i: number, field: string, value: any) => {
			onChange(pubs.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
		},
		[pubs, onChange],
	);

	const handleImportPub = useCallback(
		async (pubUrl: string) => {
			setIsImporting(true);
			try {
				const result = (await apiFetch.post('/api/communityTemplates/fetch-pub-content', {
					pubUrl,
					templateId,
				})) as any;
				const newPub: PubDef = {
					title: result.title || result.slug,
					slug: result.slug,
					content: result.content,
				};
				const updated = [...pubs, newPub];
				onChange(updated);
				setSelectedIndex(updated.length - 1);
			} catch (err: any) {
				setImportError(
					(err?.message || 'Failed to fetch pub content') +
						'. Please make sure the URL entered is a pub.',
				);
			} finally {
				setIsImporting(false);
			}
		},
		[pubs, onChange, templateId],
	);

	const selected = selectedIndex !== null ? pubs[selectedIndex] : null;

	return (
		<div className="two-col-layout">
			<div className="two-col-sidebar">
				<div className="sidebar-toolbar">
					<Button icon="add" text="Add Pub" small onClick={addPub} intent="primary" />
					<ImportPubButton
						isImporting={isImporting}
						onImport={handleImportPub}
						error={importError}
					/>
				</div>
				<div className="sidebar-list">
					{pubs.length === 0 && <div className="sidebar-empty">No starter pubs</div>}
					{pubs.map((pub, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: dynamic list
							key={i}
							className={`sidebar-row${selectedIndex === i ? ' selected' : ''}`}
							role="button"
							tabIndex={0}
							onClick={() => {
								setSelectedIndex(i);
								setImportError(null);
							}}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									setSelectedIndex(i);
									setImportError(null);
								}
							}}
						>
							<span className="sidebar-row-title">
								{pub.title || '(untitled pub)'}
							</span>
							<span className="sidebar-row-meta">
								{pub.slug ? `/${pub.slug}` : '(no slug)'}
								{pub.collectionSlug ? ` · ${pub.collectionSlug}` : ''}
							</span>
						</div>
					))}
				</div>
			</div>
			<div className="two-col-detail">
				{!selected ? (
					<NonIdealState
						icon="document"
						title="Select a pub"
						description="Choose a pub from the list to edit its settings."
					/>
				) : (
					<>
						<div className="detail-topbar">
							<h3 className="detail-title">{selected.title || '(untitled pub)'}</h3>
							<Button
								icon="trash"
								minimal
								intent="danger"
								onClick={() => removePub(selectedIndex!)}
							/>
						</div>
						<div className="detail-section">
							<div className="section-label">Settings</div>
							<div className="field-row">
								<span className="field-label">Title</span>
								<div className="field-input">
									<InputGroup
										value={selected.title}
										onChange={(e) =>
											updatePub(selectedIndex!, 'title', e.target.value)
										}
										small
									/>
								</div>
							</div>
							<div className="field-row">
								<span className="field-label">Slug</span>
								<div className="field-input">
									<InputGroup
										value={selected.slug ?? ''}
										onChange={(e) =>
											updatePub(
												selectedIndex!,
												'slug',
												e.target.value
													? slugifyString(e.target.value)
													: undefined,
											)
										}
										small
									/>
								</div>
							</div>
							<div className="field-row">
								<span className="field-label">Collection</span>
								<div className="field-input">
									<HTMLSelect
										value={selected.collectionSlug ?? ''}
										onChange={(e) =>
											updatePub(
												selectedIndex!,
												'collectionSlug',
												e.target.value || undefined,
											)
										}
										options={[
											{ value: '', label: '(none)' },
											...collectionSlugs.map((s) => ({ value: s, label: s })),
										]}
									/>
								</div>
							</div>
						</div>
						<div className="detail-section">
							<div className="section-label">Content</div>
							<div className="editor-note">
								Some advanced features (citations, math, footnotes) are not
								available in this minimal editor. For richer content, create a pub
								in a community and import it using the button in the sidebar.
							</div>
							{importError && (
								<Callout intent="danger" icon="error" style={{ marginBottom: 8 }}>
									{importError}
								</Callout>
							)}
							<div className="pub-content-editor-wrapper">
								<MinimalEditor
									key={selectedIndex}
									initialContent={selected.content || undefined}
									onContent={({ content }) =>
										updatePub(selectedIndex!, 'content', content)
									}
									useFormattingBar
									getButtons={(buttons: any) => [
										[
											...buttons.reviewButtonSet[0].filter(
												(b: any) => b.key !== 'math',
											),
											buttons.table,
										],
										[buttons.simpleMedia],
									]}
									placeholder="Write starter content for this pub..."
								/>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

/** Button + popover for importing a pub by pasting its URL */
const ImportPubButton = ({
	isImporting,
	onImport,
	error,
}: {
	isImporting: boolean;
	onImport: (pubUrl: string) => void;
	error?: string | null;
}) => {
	const [pubUrl, setPubUrl] = useState('');

	return (
		<Popover
			position="bottom"
			content={
				<div style={{ padding: 12, width: 360 }}>
					<FormGroup
						label="Pub URL"
						helperText="e.g. https://community.pubpub.org/pub/my-slug"
						style={{ marginBottom: 8 }}
					>
						<InputGroup
							value={pubUrl}
							onChange={(e) => setPubUrl(e.target.value)}
							placeholder="Paste pub URL or slug"
							small
						/>
					</FormGroup>
					{error && (
						<Callout
							intent="danger"
							icon="error"
							style={{ marginBottom: 8, fontSize: 12 }}
						>
							{error}
						</Callout>
					)}
					<Button
						icon="import"
						text="Import"
						small
						intent="primary"
						fill
						loading={isImporting}
						disabled={!pubUrl.trim()}
						onClick={() => onImport(pubUrl)}
					/>
				</div>
			}
		>
			<Button icon="import" text="Import" small />
		</Popover>
	);
};

const ImportFromUrlButton = ({
	label,
	helperText,
	placeholder,
	isImporting,
	error,
	onImport,
}: {
	label: string;
	helperText: string;
	placeholder: string;
	isImporting: boolean;
	error?: string | null;
	onImport: (url: string) => void;
}) => {
	const [url, setUrl] = useState('');

	return (
		<Popover
			position="bottom"
			content={
				<div style={{ padding: 12, width: 360 }}>
					<FormGroup label={label} helperText={helperText} style={{ marginBottom: 8 }}>
						<InputGroup
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder={placeholder}
							small
						/>
					</FormGroup>
					{error && (
						<Callout
							intent="danger"
							icon="error"
							style={{ marginBottom: 8, fontSize: 12 }}
						>
							{error}
						</Callout>
					)}
					<Button
						icon="import"
						text="Import"
						small
						intent="primary"
						fill
						loading={isImporting}
						disabled={!url.trim()}
						onClick={() => onImport(url)}
					/>
				</div>
			}
		>
			<Button icon="import" text="Import" small />
		</Popover>
	);
};

// ─── Default Members Editor ─────────────────────────────────────

const permissionOptions: Array<{ value: DefaultMemberDef['permissions']; label: string }> = [
	{ value: 'admin', label: 'Admin' },
	{ value: 'manage', label: 'Manage' },
	{ value: 'edit', label: 'Edit' },
	{ value: 'view', label: 'View' },
];

export const DefaultMembersEditor = ({
	members,
	onChange,
}: {
	members: DefaultMemberDef[];
	onChange: (m: DefaultMemberDef[]) => void;
}) => {
	const handleSelectUser = (user: any) => {
		if (members.some((m) => m.userId === user.id)) return;
		onChange([
			...members,
			{
				userId: user.id,
				permissions: 'admin',
				fullName: user.fullName,
				avatar: user.avatar,
			},
		]);
	};
	const removeMember = (i: number) => {
		onChange(members.filter((_, idx) => idx !== i));
	};
	const updatePermission = (i: number, permissions: DefaultMemberDef['permissions']) => {
		onChange(members.map((m, idx) => (idx === i ? { ...m, permissions } : m)));
	};

	return (
		<div>
			<div style={{ marginBottom: 16 }}>
				<UserAutocomplete
					onSelect={handleSelectUser as any}
					usedUserIds={members.map((m) => m.userId) as any}
					placeholder="Search for a user to add..."
				/>
			</div>
			{members.length === 0 && (
				<Callout icon="info-sign" intent="none">
					No default members. Only the creating user will be an admin.
				</Callout>
			)}
			{members.map((member, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: dynamic list without stable IDs
				<Card key={i} className="item-card">
					<div className="item-card-header">
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<Avatar
								initials={member.fullName?.[0] ?? '?'}
								avatar={member.avatar}
								width={24}
							/>
							<strong>{member.fullName ?? member.userId}</strong>
						</div>
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<HTMLSelect
								value={member.permissions}
								onChange={(e) =>
									updatePermission(
										i,
										e.target.value as DefaultMemberDef['permissions'],
									)
								}
								options={permissionOptions}
								minimal
							/>
							<Button
								icon="cross"
								minimal
								intent="danger"
								onClick={() => removeMember(i)}
							/>
						</div>
					</div>
				</Card>
			))}
		</div>
	);
};

// ─── Facet Overrides Form ────────────────────────────────────────

const citationStyles = [
	{ value: '', label: '(not set)' },
	{ value: 'apa', label: 'APA (6th ed.)' },
	{ value: 'apa-7', label: 'APA (7th ed.)' },
	{ value: 'chicago', label: 'Chicago' },
	{ value: 'harvard', label: 'Harvard' },
	{ value: 'mla', label: 'MLA' },
	{ value: 'vancouver', label: 'Vancouver' },
	{ value: 'ama', label: 'AMA' },
	{ value: 'cell', label: 'Cell' },
	{ value: 'acm-siggraph', label: 'ACM SIGGRAPH' },
	{ value: 'american-anthro', label: 'American Anthropological' },
	{ value: 'arcadia-science', label: 'Arcadia Science' },
	{ value: 'elife', label: 'eLife' },
	{ value: 'frontiers', label: 'Frontiers' },
];

const inlineCitationStyles = [
	{ value: '', label: '(not set)' },
	{ value: 'count', label: 'Numbered [1]' },
	{ value: 'authorYear', label: 'Author-Year' },
	{ value: 'author', label: 'Author' },
	{ value: 'label', label: 'Label' },
];

const licenseKinds = [
	{ value: '', label: '(not set)' },
	{ value: 'cc-by', label: 'CC-BY' },
	{ value: 'cc-0', label: 'CC-0' },
	{ value: 'cc-by-nc', label: 'CC-BY-NC' },
	{ value: 'cc-by-nd', label: 'CC-BY-ND' },
	{ value: 'cc-by-nc-nd', label: 'CC-BY-NC-ND' },
	{ value: 'cc-by-nc-sa', label: 'CC-BY-NC-SA' },
	{ value: 'cc-by-sa', label: 'CC-BY-SA' },
	{ value: 'copyright', label: 'Copyright (All rights reserved)' },
];

const pubHeaderTextStyles = [
	{ value: '', label: '(not set)' },
	{ value: 'light', label: 'Light' },
	{ value: 'dark', label: 'Dark' },
	{ value: 'white-blocks', label: 'White Blocks' },
	{ value: 'black-blocks', label: 'Black Blocks' },
];

const pubHeaderBgOptions = [
	{ value: '', label: '(not set)' },
	{ value: 'community', label: 'Community Accent' },
	{ value: 'light', label: 'Light' },
	{ value: 'dark', label: 'Dark' },
	{ value: 'custom', label: 'Custom Color...' },
];

const nodeLabelTypes = [
	{ key: 'image', label: 'Images', defaultText: 'Image' },
	{ key: 'video', label: 'Videos', defaultText: 'Video' },
	{ key: 'audio', label: 'Audio', defaultText: 'Audio' },
	{ key: 'table', label: 'Tables', defaultText: 'Table' },
	{ key: 'math', label: 'Equations', defaultText: 'Equation' },
	{ key: 'iframe', label: 'Iframes', defaultText: 'Iframe' },
] as const;

type FacetOverridesFormProps = {
	facetOverrides: FacetOverrides;
	onChange: (overrides: FacetOverrides) => void;
};

export const FacetOverridesForm = ({ facetOverrides, onChange }: FacetOverridesFormProps) => {
	const updateFacet = (facetName: keyof FacetOverrides, key: string, value: any) => {
		const current = facetOverrides[facetName] || {};
		if (value === '' || value === undefined) {
			const { [key]: _, ...rest } = current;
			const updated = Object.keys(rest).length > 0 ? rest : undefined;
			const { [facetName]: __, ...otherFacets } = facetOverrides;
			onChange(updated ? { ...otherFacets, [facetName]: updated } : otherFacets);
		} else {
			onChange({ ...facetOverrides, [facetName]: { ...current, [key]: value } });
		}
	};

	const nodeLabels = facetOverrides.NodeLabels || {};

	const updateNodeLabel = (key: string, field: 'enabled' | 'text', value: any) => {
		const current = nodeLabels[key] || {};
		const updated = { ...current, [field]: value };
		// Remove node label entry if it matches defaults (enabled: false, default text)
		const defaultText = nodeLabelTypes.find((n) => n.key === key)?.defaultText ?? key;
		if (!updated.enabled && (!updated.text || updated.text === defaultText)) {
			const { [key]: _, ...rest } = nodeLabels;
			const nl = Object.keys(rest).length > 0 ? rest : undefined;
			const { NodeLabels: __, ...otherFacets } = facetOverrides;
			onChange(nl ? { ...otherFacets, NodeLabels: nl } : otherFacets);
		} else {
			onChange({ ...facetOverrides, NodeLabels: { ...nodeLabels, [key]: updated } });
		}
	};

	return (
		<div className="overrides-form">
			<div className="section-label">Citation Style</div>
			<div className="field-row">
				<span className="field-label">Citation Format</span>
				<div className="field-input">
					<HTMLSelect
						value={facetOverrides.CitationStyle?.citationStyle || ''}
						onChange={(e) =>
							updateFacet('CitationStyle', 'citationStyle', e.target.value)
						}
						options={citationStyles}
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Inline Citations</span>
				<div className="field-input">
					<HTMLSelect
						value={facetOverrides.CitationStyle?.inlineCitationStyle || ''}
						onChange={(e) =>
							updateFacet('CitationStyle', 'inlineCitationStyle', e.target.value)
						}
						options={inlineCitationStyles}
					/>
				</div>
			</div>

			<div className="section-label">License</div>
			<div className="field-row">
				<span className="field-label">Default License</span>
				<div className="field-input">
					<HTMLSelect
						value={facetOverrides.License?.kind || ''}
						onChange={(e) => updateFacet('License', 'kind', e.target.value)}
						options={licenseKinds}
					/>
				</div>
			</div>

			<div className="section-label">Node Labels</div>
			<p style={{ color: '#666', fontSize: 13, margin: '0 0 8px' }}>
				Auto-numbered captions for embedded content (e.g. "Figure 1", "Table 2").
			</p>
			{nodeLabelTypes.map(({ key, label, defaultText }) => (
				<div className="field-row" key={key}>
					<span className="field-label">{label}</span>
					<div
						className="field-input"
						style={{ display: 'flex', gap: 8, alignItems: 'center' }}
					>
						<Switch
							style={{ marginBottom: 0 }}
							checked={nodeLabels[key]?.enabled ?? false}
							onChange={() =>
								updateNodeLabel(
									key,
									'enabled',
									!(nodeLabels[key]?.enabled ?? false),
								)
							}
							innerLabel="off"
							innerLabelChecked="on"
						/>
						<InputGroup
							small
							style={{ width: 120 }}
							placeholder={defaultText}
							value={nodeLabels[key]?.text ?? ''}
							onChange={(e) => updateNodeLabel(key, 'text', e.target.value)}
						/>
					</div>
				</div>
			))}

			<div className="section-label">Pub Header Theme</div>
			<div className="field-row">
				<span className="field-label">Text Style</span>
				<div className="field-input">
					<HTMLSelect
						value={facetOverrides.PubHeaderTheme?.textStyle || ''}
						onChange={(e) => updateFacet('PubHeaderTheme', 'textStyle', e.target.value)}
						options={pubHeaderTextStyles}
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Background Color</span>
				<div
					className="field-input"
					style={{ display: 'flex', gap: 8, alignItems: 'center' }}
				>
					<HTMLSelect
						value={(() => {
							const bg = facetOverrides.PubHeaderTheme?.backgroundColor;
							if (!bg) return '';
							if (['community', 'light', 'dark'].includes(bg)) return bg;
							return 'custom';
						})()}
						onChange={(e) => {
							const val = e.target.value;
							if (val === 'custom') {
								updateFacet('PubHeaderTheme', 'backgroundColor', '#000000');
							} else {
								updateFacet('PubHeaderTheme', 'backgroundColor', val);
							}
						}}
						options={pubHeaderBgOptions}
					/>
					{facetOverrides.PubHeaderTheme?.backgroundColor &&
						!['community', 'light', 'dark', ''].includes(
							facetOverrides.PubHeaderTheme.backgroundColor,
						) && (
							<ColorInput
								value={facetOverrides.PubHeaderTheme.backgroundColor}
								onChange={(color: any) =>
									updateFacet('PubHeaderTheme', 'backgroundColor', color.hex)
								}
							/>
						)}
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Background Image</span>
				<div className="field-input">
					<ImageUpload
						defaultImage={facetOverrides.PubHeaderTheme?.backgroundImage ?? undefined}
						onNewImage={(url) =>
							updateFacet('PubHeaderTheme', 'backgroundImage', url || '')
						}
						canClear
						height={60}
						width={100}
						helperText="1200×800px recommended"
					/>
				</div>
			</div>

			<div className="section-label">Pub Connections Display</div>
			<div className="field-row">
				<span className="field-label">Default to Carousel</span>
				<div className="field-input">
					<Switch
						style={{ marginBottom: 0 }}
						checked={facetOverrides.PubEdgeDisplay?.defaultsToCarousel ?? true}
						onChange={() =>
							updateFacet(
								'PubEdgeDisplay',
								'defaultsToCarousel',
								!(facetOverrides.PubEdgeDisplay?.defaultsToCarousel ?? true),
							)
						}
					/>
				</div>
			</div>
			<div className="field-row">
				<span className="field-label">Show Descriptions</span>
				<div className="field-input">
					<Switch
						style={{ marginBottom: 0 }}
						checked={facetOverrides.PubEdgeDisplay?.descriptionIsVisible ?? true}
						onChange={() =>
							updateFacet(
								'PubEdgeDisplay',
								'descriptionIsVisible',
								!(facetOverrides.PubEdgeDisplay?.descriptionIsVisible ?? true),
							)
						}
					/>
				</div>
			</div>
		</div>
	);
};
