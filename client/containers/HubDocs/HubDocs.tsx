import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import './hubDocs.scss';

/* ── Documentation sections ── */
type Section = {
	id: string;
	title: string;
	level: 2 | 3;
};

const sections: Section[] = [
	{ id: 'what-is-a-hub', title: 'What Is a Hub?', level: 2 },
	{ id: 'getting-started', title: 'Getting Started', level: 2 },
	{ id: 'landing-page', title: 'Landing Page', level: 2 },
	{ id: 'hero-section', title: 'Hero & Branding', level: 3 },
	{ id: 'community-grid', title: 'Community Grid', level: 3 },
	{ id: 'featured-pubs', title: 'Featured Pubs', level: 3 },
	{ id: 'dashboard-overview', title: 'Dashboard Overview', level: 2 },
	{ id: 'tab-overview', title: 'Overview Tab', level: 3 },
	{ id: 'tab-communities', title: 'Communities Tab', level: 3 },
	{ id: 'tab-publications', title: 'Publications Tab', level: 3 },
	{ id: 'tab-authors', title: 'Authors Tab', level: 3 },
	{ id: 'tab-collections', title: 'Collections Tab', level: 3 },
	{ id: 'tab-graphs', title: 'Graphs Tab', level: 3 },
	{ id: 'tab-suggested-communities', title: 'Suggested Communities Tab', level: 3 },
	{ id: 'tab-suggested-pubs', title: 'Suggested Pubs Tab', level: 3 },
	{ id: 'tab-templates', title: 'Templates Tab', level: 3 },
	{ id: 'tab-settings', title: 'Settings Tab', level: 3 },
	{ id: 'managing-communities', title: 'Managing Communities', level: 2 },
	{ id: 'adding-communities', title: 'Adding Communities', level: 3 },
	{ id: 'suggested-discovery', title: 'Automatic Discovery', level: 3 },
	{ id: 'data-access', title: 'Data Access Levels', level: 3 },
	{ id: 'community-opt-out', title: 'Community Opt-Out', level: 3 },
	{ id: 'curated-pubs', title: 'Curated Pubs', level: 2 },
	{ id: 'templates', title: 'Community Templates', level: 2 },
	{ id: 'creating-templates', title: 'Creating Templates', level: 3 },
	{ id: 'cloning-templates', title: 'Cloning from a Community', level: 3 },
	{ id: 'template-editor', title: 'Template Editor', level: 3 },
	{ id: 'community-creation', title: 'Community Creation', level: 2 },
	{ id: 'creation-flow', title: 'The Creation Flow', level: 3 },
	{ id: 'clone-access', title: 'Clone from Community', level: 3 },
	{ id: 'domain-restrictions', title: 'Domain Restrictions', level: 3 },
	{ id: 'auto-approval', title: 'Auto-Approval', level: 3 },
	{ id: 'analytics', title: 'Analytics', level: 2 },
	{ id: 'analytics-overview', title: 'Page Views & Downloads', level: 3 },
	{ id: 'analytics-scope', title: 'Analytics Scope', level: 3 },
	{ id: 'brand-helper', title: 'Brand Helper', level: 2 },
	{ id: 'graphs', title: 'Graph Visualizations', level: 2 },
	{ id: 'graph-force', title: 'Force-Directed Graph', level: 3 },
	{ id: 'graph-bundle', title: 'Edge Bundle', level: 3 },
	{ id: 'graph-bipartite', title: 'Bipartite Layout', level: 3 },
	{ id: 'graph-matrix', title: 'Adjacency Matrix', level: 3 },
	{ id: 'graph-tree', title: 'Tree Layout', level: 3 },
	{ id: 'graph-export', title: 'Data Export', level: 3 },
	{ id: 'managers', title: 'Hub Managers', level: 2 },
];

/* ── Sidebar groups ── */
type SidebarGroup = { label: string; items: { id: string; title: string }[] };
const sidebarGroups: SidebarGroup[] = [
	{
		label: 'Introduction',
		items: [
			{ id: 'what-is-a-hub', title: 'What Is a Hub?' },
			{ id: 'getting-started', title: 'Getting Started' },
		],
	},
	{
		label: 'Landing Page',
		items: [
			{ id: 'landing-page', title: 'Overview' },
			{ id: 'hero-section', title: 'Hero & Branding' },
			{ id: 'community-grid', title: 'Community Grid' },
			{ id: 'featured-pubs', title: 'Featured Pubs' },
		],
	},
	{
		label: 'Dashboard',
		items: [
			{ id: 'dashboard-overview', title: 'Overview' },
			{ id: 'tab-overview', title: 'Overview Tab' },
			{ id: 'tab-communities', title: 'Communities' },
			{ id: 'tab-publications', title: 'Publications' },
			{ id: 'tab-authors', title: 'Authors' },
			{ id: 'tab-collections', title: 'Collections' },
			{ id: 'tab-graphs', title: 'Graphs' },
			{ id: 'tab-suggested-communities', title: 'Suggested Communities' },
			{ id: 'tab-suggested-pubs', title: 'Suggested Pubs' },
			{ id: 'tab-templates', title: 'Templates' },
			{ id: 'tab-settings', title: 'Settings' },
		],
	},
	{
		label: 'Features',
		items: [
			{ id: 'managing-communities', title: 'Managing Communities' },
			{ id: 'curated-pubs', title: 'Curated Pubs' },
			{ id: 'templates', title: 'Community Templates' },
			{ id: 'community-creation', title: 'Community Creation' },
			{ id: 'clone-access', title: 'Clone from Community' },
			{ id: 'analytics', title: 'Analytics' },
			{ id: 'brand-helper', title: 'Brand Helper' },
			{ id: 'graphs', title: 'Graph Visualizations' },
			{ id: 'managers', title: 'Hub Managers' },
		],
	},
];

/* ── Hook: track which heading is in the viewport ── */
const useActiveSection = (ids: string[]) => {
	const [active, setActive] = useState(ids[0]);
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setActive(entry.target.id);
						break;
					}
				}
			},
			{ rootMargin: '-80px 0px -60% 0px', threshold: 0 },
		);
		for (const id of ids) {
			const el = document.getElementById(id);
			if (el) observer.observe(el);
		}
		return () => observer.disconnect();
	}, [ids]);
	return active;
};

/* ── Main component ── */
const HubDocs = () => {
	const sectionIds = useMemo(() => sections.map((s) => s.id), []);
	const activeSection = useActiveSection(sectionIds);

	const scrollTo = useCallback((id: string) => {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}, []);

	/* Right-hand TOC entries: only h2-level for the current visible "chapter" */
	const currentH2Index = useMemo(() => {
		const idx = sections.findIndex((s) => s.id === activeSection);
		if (idx === -1) return 0;
		for (let i = idx; i >= 0; i--) {
			if (sections[i].level === 2) return i;
		}
		return 0;
	}, [activeSection]);

	const tocItems = useMemo(() => {
		const items: Section[] = [];
		for (let i = currentH2Index; i < sections.length; i++) {
			if (i > currentH2Index && sections[i].level === 2) break;
			items.push(sections[i]);
		}
		return items;
	}, [currentH2Index]);

	return (
		<div className="hub-docs-page">
			{/* Top bar */}
			<div className="hub-docs-topbar">
				<div className="hub-docs-topbar-inner">
					<a href="/hubs/docs" className="hub-docs-topbar-brand">
						PubPub Hubs Documentation
					</a>
					<div className="hub-docs-topbar-links">
						<a href="/hubs">Browse Hubs</a>
						<a href="/hubs/pricing">Pricing</a>
					</div>
				</div>
			</div>

			<div className="hub-docs-layout">
				{/* Left sidebar */}
				<nav className="hub-docs-sidebar">
					{sidebarGroups.map((group) => (
						<div key={group.label} className="hub-docs-sidebar-group">
							<div className="hub-docs-sidebar-heading">{group.label}</div>
							{group.items.map((item) => (
								<a
									key={item.id}
									href={`#${item.id}`}
									className={`hub-docs-sidebar-link${activeSection === item.id ? ' active' : ''}`}
									onClick={(e) => {
										e.preventDefault();
										scrollTo(item.id);
									}}
								>
									{item.title}
								</a>
							))}
						</div>
					))}
				</nav>

				{/* Main content */}
				<article className="hub-docs-content">
					<h1>PubPub Hubs</h1>
					<p className="docs-lead">
						A guide to managing your PubPub Hub, covering branding, community
						management, analytics, templates, and graph visualizations.
					</p>

					{/* ── What Is a Hub? ── */}
					<h2 id="what-is-a-hub">What Is a Hub?</h2>
					<p>
						A <strong>Hub</strong> is PubPub's organizational layer for institutions,
						foundations, and consortia that oversee multiple publishing communities. It
						brings together all of the communities your organization sponsors, hosts, or
						manages under a shared landing page with centralized analytics and
						administrative tools.
					</p>
					<p>Key capabilities of a Hub include:</p>
					<ul>
						<li>
							A public <strong>landing page</strong> showcasing your communities and
							highlighted publications
						</li>
						<li>
							A <strong>management dashboard</strong> with ten tabs covering
							analytics, community oversight, templates, and more
						</li>
						<li>
							<strong>Community templates</strong> that let new communities start with
							pre-built pages, layouts, and branding
						</li>
						<li>
							<strong>Domain-restricted community creation</strong> so members of your
							organization can self-provision communities
						</li>
						<li>
							<strong>Graph visualizations</strong> that map the relationships between
							communities, authors, and publications
						</li>
						<li>
							Detailed <strong>analytics</strong> covering page views, downloads, and
							publication activity
						</li>
					</ul>

					{/* ── Getting Started ── */}
					<h2 id="getting-started">Getting Started</h2>
					<p>
						Once your Hub has been created by the PubPub team, you'll receive access to
						two main areas:
					</p>
					<ol>
						<li>
							<strong>Landing page</strong> at <code>pubpub.org/hub/your-slug</code>,
							the public face of your Hub, visible to everyone.
						</li>
						<li>
							<strong>Dashboard</strong> at <code>pubpub.org/hub/your-slug/data</code>
							, the management console, visible only to Hub managers and PubPub
							admins.
						</li>
					</ol>
					<p>Your first steps should be:</p>
					<ol>
						<li>
							Configure your Hub's branding in <strong>Settings</strong> (title,
							colors, logos, hero image)
						</li>
						<li>
							Add communities to your Hub via the{' '}
							<strong>Settings → Communities</strong> section or the{' '}
							<strong>Suggested Communities</strong> tab
						</li>
						<li>
							Optionally curate featured publications in{' '}
							<strong>Settings → Curated Pubs</strong>
						</li>
						<li>
							Set up community templates if you want to offer standardized starting
							points
						</li>
					</ol>

					{/* ── Landing Page ── */}
					<h2 id="landing-page">Landing Page</h2>
					<p>
						The landing page is the public face of your Hub. It's designed to help
						visitors discover the communities and publications under your umbrella.
					</p>

					<h3 id="hero-section">Hero & Branding</h3>
					<p>
						The top of the landing page features a customizable hero section. You can
						configure these elements in the <strong>Settings</strong> tab of the
						dashboard:
					</p>
					<ul>
						<li>
							<strong>Hero Background Image</strong>: a full-width image behind the
							hero text
						</li>
						<li>
							<strong>Hero Logo</strong>: a wide-format logo placed above the title
							(if set, the text title is hidden)
						</li>
						<li>
							<strong>Avatar</strong>: a square logo shown in the navigation bar and
							footer
						</li>
						<li>
							<strong>Title & Subtitle</strong>: displayed in the hero when no hero
							logo is set
						</li>
						<li>
							<strong>Description</strong>: up to 280 characters shown below the
							title/subtitle
						</li>
						<li>
							<strong>Accent Colors</strong>: a dark and light color pair used
							throughout the page (navigation bar, buttons, links)
						</li>
					</ul>
					<div className="docs-tip">
						<strong>Tip:</strong> Use the <strong>Brand Helper</strong> in Settings to
						automatically import colors, logos, and descriptions from your institution's
						website.
					</div>

					<h3 id="community-grid">Community Grid</h3>
					<p>
						Below the hero, all communities with <strong>Show on Landing Page</strong>{' '}
						enabled are displayed in a three-column grid. Each community card shows:
					</p>
					<ul>
						<li>The community's hero image or a gradient based on its accent color</li>
						<li>Community logo, title, and description</li>
						<li>The community URL and a badge with the total publication count</li>
					</ul>
					<p>
						Visitors can search the grid by community name using the built-in filter
						bar. Communities can be toggled on or off the landing page individually in
						<strong> Settings → Communities</strong>.
					</p>

					<h3 id="featured-pubs">Featured Pubs</h3>
					<p>
						If you curate featured publications (via{' '}
						<strong>Settings → Curated Pubs</strong>), they are interleaved with
						community cards on the landing page. Featured pubs appear in pairs and show
						the publication title, description, author byline, the originating
						community, and the publication date.
					</p>

					{/* ── Dashboard ── */}
					<h2 id="dashboard-overview">Dashboard Overview</h2>
					<p>
						The Hub dashboard is your management console. It's accessible to Hub
						managers and PubPub admins at <code>pubpub.org/hub/your-slug/data</code>.
						The dashboard is organized into ten tabs.
					</p>

					<h3 id="tab-overview">Overview Tab</h3>
					<p>The Overview tab gives you a high-level summary of your Hub's activity:</p>
					<ul>
						<li>
							<strong>Summary cards</strong>: total communities, publications,
							releases, collections, authors, pubs this year, page views, and
							downloads
						</li>
						<li>
							<strong>Page Views chart</strong>: an interactive area chart showing
							daily page views. Use the time range buttons (30 days, 90 days, 1 year,
							2 years) or set a custom date range.
						</li>
						<li>
							<strong>Publication Activity</strong>: a sparkbar showing monthly
							publication counts
						</li>
						<li>
							<strong>Community Breakdown</strong>: a sortable table listing every
							community with their pub count, releases, authors, downloads, total
							views, a 90-day views sparkline, and the date of their latest
							publication
						</li>
					</ul>
					<div className="docs-note">
						<strong>Note:</strong> Page view and download data is only available for
						communities and pubs that have <strong>granted</strong> data access. The
						Analytics Scope badge at the top of the chart shows how many communities are
						included.
					</div>

					<h3 id="tab-communities">Communities Tab</h3>
					<p>A card-based view of every community in your Hub. Each card shows:</p>
					<ul>
						<li>An accent color bar matching the community's branding</li>
						<li>Key stats: pubs, releases, authors, collections, views, downloads</li>
						<li>Meta information: latest pub date, oldest pub date, pubs this month</li>
						<li>A 90-day page views sparkline (if data access is granted)</li>
						<li>Community manager list (expandable, if data access is granted)</li>
					</ul>

					<h3 id="tab-publications">Publications Tab</h3>
					<p>
						A searchable, filterable table of publications across all your communities
						(up to 2,000 recent pubs). Columns include:
					</p>
					<ul>
						<li>Title and description</li>
						<li>Authors (shown as avatar chips)</li>
						<li>Originating community</li>
						<li>Activity sparkline</li>
						<li>Created and published dates</li>
					</ul>

					<h3 id="tab-authors">Authors Tab</h3>
					<p>
						A table of all authors across your Hub, ranked by publication count. Shows
						author name (linked to their PubPub profile), total publications, the
						communities they've published in, and their ORCID if available.
					</p>

					<h3 id="tab-collections">Collections Tab</h3>
					<p>
						Lists all collections from your communities. Each row shows the collection
						name, type (Issue, Book, Conference, or Tag), the community it belongs to,
						and the number of publications it contains.
					</p>

					<h3 id="tab-graphs">Graphs Tab</h3>
					<p>
						Five different interactive visualizations of the relationships between your
						communities, authors, and publications. See the{' '}
						<a href="#graphs">Graph Visualizations</a> section for full details on each
						type.
					</p>

					<h3 id="tab-suggested-communities">Suggested Communities Tab</h3>
					<p>
						This tab uses your Hub's configured email domains to discover PubPub
						communities that may be affiliated with your organization. It identifies
						communities where managers or authors have email addresses matching your
						domains.
					</p>
					<p>
						The summary bar shows how many communities were discovered, how many you've
						already added, and how many are available. You can sort by community name,
						manager count, author count, pub count, or creation date, and add or remove
						communities directly.
					</p>
					<div className="docs-note">
						<strong>Privacy:</strong> No individual people, email addresses, or private
						information are shown in this tab. You only see the names of associated
						communities and aggregate counts (e.g. "3 managers, 12 authors"). Hubs do
						not expose any data that is not already publicly visible on PubPub. We take
						user and community privacy seriously, and this tool does not change that
						commitment.
					</div>
					<div className="docs-tip">
						<strong>Tip:</strong> Email domains are configured by the PubPub team. If
						you need to add or change domains, contact us.
					</div>

					<h3 id="tab-suggested-pubs">Suggested Pubs Tab</h3>
					<p>
						Similar to Suggested Communities, this tab discovers publications using
						full-text search across PubPub. Search terms are configured by PubPub admins
						and matched against publication titles, abstracts, and content.
					</p>
					<p>
						Use the "Only show pubs from non-curated communities" toggle to filter out
						publications from communities already in your Hub. You can add or remove
						individual publications from your curated pubs list.
					</p>
					<div className="docs-note">
						<strong>Privacy:</strong> Suggested Pubs shows only publicly available
						publications, similar to what you would find using PubPub's public search
						page. No private or draft content is included.
					</div>

					<h3 id="tab-templates">Templates Tab</h3>
					<p>
						Manage community templates that define default pages, layouts, navigation,
						collections, and styling for new communities. See the{' '}
						<a href="#templates">Community Templates</a> section for full details.
					</p>

					<h3 id="tab-settings">Settings Tab</h3>
					<p>The Settings tab is organized into several sections:</p>
					<ul>
						<li>
							<strong>Hub Info</strong>: title, subtitle, description, website,
							contact email, avatar, hero logo, hero background image, accent colors,
							community creation toggle, community clone access setting, and the Brand
							Helper
						</li>
						<li>
							<strong>Managers</strong>: add or remove Hub managers by searching for
							PubPub users
						</li>
						<li>
							<strong>Communities</strong>: add communities by search, toggle landing
							page visibility, manage data access requests
						</li>
						<li>
							<strong>Curated Pubs</strong>: add pubs by search or PubPub URL, toggle
							landing page visibility, manage data access
						</li>
						<li>
							<strong>Email Domains</strong>: view the configured email domain
							patterns (managed by PubPub admins)
						</li>
						<li>
							<strong>Pub Search Terms</strong>: view the configured full-text search
							phrases (managed by PubPub admins)
						</li>
					</ul>

					{/* ── Managing Communities ── */}
					<h2 id="managing-communities">Managing Communities</h2>

					<h3 id="adding-communities">Adding Communities</h3>
					<p>There are several ways to add communities to your Hub:</p>
					<ol>
						<li>
							<strong>Manual search</strong>: in Settings → Communities, search for
							any PubPub community by name, subdomain, or URL and add it directly.
						</li>
						<li>
							<strong>Suggested Communities</strong>: use the Suggested Communities
							tab to discover communities based on email domain matching and add them
							with one click.
						</li>
						<li>
							<strong>Community creation</strong>: when a user creates a new community
							through your Hub's landing page, it is automatically added.
						</li>
					</ol>

					<h3 id="suggested-discovery">Automatic Discovery</h3>
					<p>
						The Suggested Communities feature works by matching your Hub's configured
						email domains against PubPub communities. For example, if your domain is{' '}
						<code>mit.edu</code>, it will find communities where managers or authors
						have <code>@mit.edu</code> email addresses.
					</p>
					<div className="docs-note">
						<strong>Privacy:</strong> No specific people or email addresses are shown to
						Hub managers. You only see the associated community names and aggregate
						counts. The Hubs tool does not expose any private information that is not
						already visible across PubPub.
					</div>
					<p>
						This can help you discover communities at your institution that you might
						not know about, especially where groups are publishing independently.
					</p>

					<h3 id="data-access">Data Access Levels</h3>
					<p>
						When you add a community (or a curated pub), you can request different
						levels of data access:
					</p>
					<table>
						<thead>
							<tr>
								<th>Level</th>
								<th>What You See</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>
									<strong>None</strong>
								</td>
								<td>Basic listing and aggregate stats only</td>
							</tr>
							<tr>
								<td>
									<strong>Requested</strong>
								</td>
								<td>
									You've asked for access, awaiting the community admin's approval
								</td>
							</tr>
							<tr>
								<td>
									<strong>Granted</strong>
								</td>
								<td>
									Full analytics: page views, downloads, sparklines, manager
									lists, and per-pub activity
								</td>
							</tr>
						</tbody>
					</table>
					<p>
						Community administrators can approve or deny data access requests from their
						community's settings. You can see the current access level for each
						community in the Settings → Communities table.
					</p>

					<h3 id="community-opt-out">Community Opt-Out</h3>
					<p>
						Community administrators have the right to opt out of your Hub at any time.
						When a community opts out, it will no longer appear on your landing page or
						in your Suggested Communities. To re-add an opted-out community, the
						community admin would need to opt back in.
					</p>

					{/* ── Curated Pubs ── */}
					<h2 id="curated-pubs">Curated Pubs</h2>
					<p>
						In addition to managing communities, you can curate individual publications.
						This is useful for:
					</p>
					<ul>
						<li>Highlighting noteworthy publications on your landing page</li>
						<li>Tracking publications from communities not yet in your Hub</li>
						<li>Discovering publications through the Suggested Pubs search</li>
					</ul>
					<p>
						Curated pubs can be added in <strong>Settings → Curated Pubs</strong> by
						searching for a pub title or pasting a PubPub URL. Like communities, curated
						pubs have data access levels and landing page visibility toggles.
					</p>

					{/* ── Templates ── */}
					<h2 id="templates">Community Templates</h2>
					<p>
						Templates are pre-configured community setups that you can offer to users
						creating new communities through your Hub. A template can include:
					</p>
					<ul>
						<li>Default pages with layouts</li>
						<li>Collections (issues, books, tags)</li>
						<li>Navigation menus</li>
						<li>Footer links</li>
						<li>Accent colors and branding</li>
						<li>Custom CSS</li>
						<li>Facet overrides (citation style, license, etc.)</li>
					</ul>

					<h3 id="creating-templates">Creating Templates</h3>
					<p>
						In the <strong>Templates</strong> tab, click{' '}
						<strong>Create Template</strong> to start a new template from scratch.
						You'll provide a title, slug, and optional description. The template will
						open in the Template Editor where you can configure all its settings.
					</p>

					<h3 id="cloning-templates">Cloning from a Community</h3>
					<p>
						The fastest way to create a template is to clone one from an existing PubPub
						community. Click <strong>Clone from Community</strong> and paste the
						community's URL. The system will extract:
					</p>
					<ul>
						<li>Community branding and settings (colors, logos, hero images)</li>
						<li>Up to 25 public pages with their layouts</li>
						<li>Up to 25 public collections with their layouts</li>
						<li>Navigation structure and footer links</li>
						<li>Custom CSS and facet overrides</li>
					</ul>
					<div className="docs-note">
						<strong>Privacy:</strong> Members, publications, and private content are
						never copied. Only the community's publicly visible structure and
						configuration are included (page layouts, navigation, colors, etc.). No
						private or draft content is ever accessed.
					</div>

					<h3 id="template-editor">Template Editor</h3>
					<p>
						Click a template's title or edit icon to open the Template Editor. Here you
						can modify every aspect of the template: add or remove pages, edit layouts,
						change navigation, adjust branding, and more. Changes are saved to the
						template and will apply to future communities created with it (existing
						communities are not affected).
					</p>
					<p>
						Each template can be toggled <strong>Active</strong> or{' '}
						<strong>Inactive</strong>. Only active templates appear as options in the
						community creation flow.
					</p>

					{/* ── Community Creation ── */}
					<h2 id="community-creation">Community Creation</h2>

					<h3 id="creation-flow">The Creation Flow</h3>
					<p>
						When community creation is enabled for your Hub, a "Create a Community"
						button appears on the landing page. Clicking it takes the user to a creation
						form branded with your Hub's identity. The form includes:
					</p>
					<ol>
						<li>
							A template picker (if your Hub has active templates or clone access is
							enabled)
						</li>
						<li>
							A "Clone from Community" option (if enabled), letting users copy the
							structure and branding of an existing hub community
						</li>
						<li>Community URL (subdomain), title, and description</li>
						<li>
							Logo and accent color pickers (hidden if a template or clone source is
							selected)
						</li>
						<li>Terms of service agreement</li>
					</ol>

					<h3 id="clone-access">Clone from Community</h3>
					<p>
						When clone access is enabled, users creating a new community through your
						Hub can choose to clone an existing hub community instead of starting from
						scratch or using a template. Cloning copies the source community's publicly
						visible structure: pages, layouts, navigation, collections, branding,
						colors, and custom CSS. No publications, members, or private content are
						copied.
					</p>
					<p>
						The clone access setting is configured in{' '}
						<strong>Settings → Hub Info</strong> and has three options:
					</p>
					<table>
						<thead>
							<tr>
								<th>Setting</th>
								<th>Behavior</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>
									<strong>Off</strong>
								</td>
								<td>Clone option is not shown in the creation flow (default)</td>
							</tr>
							<tr>
								<td>
									<strong>Everyone</strong>
								</td>
								<td>
									All users can clone from communities visible on the Hub's
									landing page
								</td>
							</tr>
							<tr>
								<td>
									<strong>Hub managers only</strong>
								</td>
								<td>
									Only Hub managers and PubPub admins can clone, and they can
									clone from any hub community (not just landing-page-visible
									ones)
								</td>
							</tr>
						</tbody>
					</table>
					<p>
						When a user selects the clone option, they pick a source community from a
						dropdown. The system creates a template behind the scenes from the selected
						community and applies it to the new community. If the same community has
						been cloned before, the existing template is reused.
					</p>
					<div className="docs-note">
						<strong>Note:</strong> Clone access requires community creation to be
						enabled and at least one community in the Hub. The clone option only appears
						if both conditions are met.
					</div>

					<h3 id="domain-restrictions">Domain Restrictions</h3>
					<p>
						The "Create a Community" button only appears to users whose email address
						matches one of the Hub's configured email domains. For example, if your
						Hub's domains include <code>stanford.edu</code>, only users with a
						<code> @stanford.edu</code> email can create communities through your Hub.
					</p>
					<p>
						Email domains are configured by the PubPub team and support subdomain
						matching. Setting <code>ox.ac.uk</code> will match{' '}
						<code>@history.ox.ac.uk</code>, <code>@cs.ox.ac.uk</code>, etc.
					</p>

					<h3 id="auto-approval">Auto-Approval</h3>
					<p>
						Communities created through a Hub skip the normal approval queue. They are
						immediately public and ready to use. The new community is also automatically
						added to the Hub with data access granted and will appear in the dashboard
						right away.
					</p>
					<div className="docs-tip">
						<strong>Tip:</strong> This is one of the biggest advantages of Hub-based
						community creation. New communities are instantly live with no waiting
						period.
					</div>

					{/* ── Analytics ── */}
					<h2 id="analytics">Analytics</h2>

					<h3 id="analytics-overview">Page Views & Downloads</h3>
					<p>
						The Hub dashboard aggregates page view and download data from all
						communities that have granted data access. Analytics are available in
						several places:
					</p>
					<ul>
						<li>
							<strong>Overview tab</strong>: total page views chart with time range
							controls, summary cards
						</li>
						<li>
							<strong>Community Breakdown table</strong>: per-community totals and
							90-day sparklines
						</li>
						<li>
							<strong>Communities tab</strong>: detailed per-community analytics cards
						</li>
						<li>
							<strong>Publications tab</strong>: per-pub activity sparklines
						</li>
					</ul>

					<h3 id="analytics-scope">Analytics Scope</h3>
					<p>
						Because data access requires community approval, your analytics may not
						cover all communities. The <strong>Analytics Scope</strong> badge displayed
						on charts shows how many of your communities have granted access (e.g., "8
						of 12 communities"). This helps you understand the coverage of the data
						you're seeing.
					</p>

					{/* ── Brand Helper ── */}
					<h2 id="brand-helper">Brand Helper</h2>
					<p>
						The Brand Helper is a tool in the Settings tab that can automatically import
						your institution's branding from their website. Enter a domain (e.g.,{' '}
						<code>mit.edu</code>) and the tool will fetch:
					</p>
					<ul>
						<li>Logos and favicons</li>
						<li>Brand colors</li>
						<li>Site title and description</li>
						<li>Hero/background images</li>
					</ul>
					<p>
						Each extracted asset is presented as a clickable option that you can apply
						to the corresponding Hub field. This saves significant time when setting up
						your Hub's branding.
					</p>

					{/* ── Graphs ── */}
					<h2 id="graphs">Graph Visualizations</h2>
					<p>
						The Graphs tab provides five different interactive visualizations of the
						relationships within your Hub. These are useful for understanding
						cross-community collaboration, identifying key authors, and exploring the
						structure of your publishing network.
					</p>
					<p>
						All graph views include toggle controls for showing or hiding{' '}
						<strong>Publications</strong> and <strong>People</strong> (authors and
						managers). Nodes are color-coded: gray for communities, light blue for
						publications, orange for authors, purple for managers.
					</p>

					<h3 id="graph-force">Force-Directed Graph</h3>
					<p>
						An interactive physics simulation where nodes attract and repel each other
						based on their connections. This is the default view and works well for
						exploring the overall network topology. You can:
					</p>
					<ul>
						<li>Click a node to highlight it and its neighbors</li>
						<li>Click the background to reset the highlight</li>
						<li>Zoom and pan to explore dense areas</li>
						<li>Hover over nodes to see labels</li>
					</ul>

					<h3 id="graph-bundle">Edge Bundle</h3>
					<p>
						A circular layout where nodes are arranged around the perimeter and
						connections are drawn as bundled curves through the center. This view is
						helpful for seeing the density of cross-community connections and
						identifying clusters.
					</p>

					<h3 id="graph-bipartite">Bipartite Layout</h3>
					<p>
						A two-column layout that separates nodes into groups (e.g., communities on
						the left, people on the right) with connections drawn between them. Useful
						for understanding which people bridge multiple communities.
					</p>

					<h3 id="graph-matrix">Adjacency Matrix</h3>
					<p>
						A grid view where rows and columns represent nodes and filled cells
						represent connections between them. This is useful for dense networks where
						edge-based views become too cluttered, and for spotting structural patterns.
					</p>

					<h3 id="graph-tree">Tree Layout</h3>
					<p>
						A hierarchical view with the Hub at the root, communities as branches, and
						publications/people as leaves. Good for seeing the overall composition and
						relative size of each community.
					</p>

					<h3 id="graph-export">Data Export</h3>
					<p>
						The <strong>Copy JSON</strong> button in the Graphs tab copies a structured
						data export to your clipboard. This includes:
					</p>
					<ul>
						<li>Hub summary statistics</li>
						<li>Per-community data (pubs, authors, data access level, managers)</li>
						<li>Graph topology (node and link counts)</li>
						<li>
							Cross-community people (individuals active in 2+ communities) with their
							roles
						</li>
						<li>Community overlap matrix showing which communities share people</li>
					</ul>
					<div className="docs-tip">
						<strong>Tip:</strong> The JSON export is useful for further analysis in
						spreadsheets or data tools, and for reporting on cross-community
						collaboration.
					</div>

					{/* ── Managers ── */}
					<h2 id="managers">Hub Managers</h2>
					<p>
						Hub managers are PubPub users who have administrative access to the Hub
						dashboard. Managers can:
					</p>
					<ul>
						<li>View all dashboard tabs and analytics</li>
						<li>Add and remove communities</li>
						<li>Manage curated pubs</li>
						<li>Request and manage data access</li>
						<li>Create and edit community templates</li>
						<li>Update Hub branding and settings</li>
						<li>Add and remove other managers</li>
					</ul>
					<p>
						Managers are added in <strong>Settings → Managers</strong> by searching for
						PubPub users by name, slug, or email. There is no limit on the number of
						managers a Hub can have.
					</p>
					<div className="docs-note">
						<strong>Note:</strong> Some settings, such as email domains, pub search
						terms, and the Hub's active/private status, can only be modified by PubPub
						administrators. Contact us if you need changes to these settings.
					</div>
					<p>
						For information about Hub pricing, see the{' '}
						<a href="/hubs/pricing">Hub Pricing page</a>.
					</p>
				</article>

				{/* Right-hand TOC */}
				<nav className="hub-docs-toc">
					<div className="hub-docs-toc-label">On this page</div>
					{tocItems.map((item) => (
						<a
							key={item.id}
							href={`#${item.id}`}
							className={`hub-docs-toc-link${item.level === 3 ? ' depth-3' : ''}${activeSection === item.id ? ' active' : ''}`}
							onClick={(e) => {
								e.preventDefault();
								scrollTo(item.id);
							}}
						>
							{item.title}
						</a>
					))}
				</nav>
			</div>
		</div>
	);
};

export default HubDocs;
