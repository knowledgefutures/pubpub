import type { OrgDataPayload } from 'server/hub/dataQueries';

/* ─── Shared types for all graph visualizations ─── */

export type NodeType = 'community' | 'pub' | 'person';

export type GraphNode = {
	id: string;
	label: string;
	type: NodeType;
	communityId?: string; // for pubs
	accentColor?: string; // community brand color
	pubCount?: number; // community total pubs
	role?: 'author' | 'manager' | 'both';
};

export type GraphLink = {
	source: string;
	target: string;
	type: 'pub-community' | 'person-pub' | 'person-community';
};

export type GraphData = {
	nodes: GraphNode[];
	links: GraphLink[];
	communities: GraphNode[];
	pubs: GraphNode[];
	people: GraphNode[];
	/** community ID → pub IDs */
	communityPubs: Map<string, string[]>;
	/** person ID → community IDs */
	personCommunities: Map<string, Set<string>>;
	/** person ID → pub IDs */
	personPubs: Map<string, Set<string>>;
	/** community pair key → shared person names */
	communityOverlap: Map<string, string[]>;
};

export const COLORS = {
	community: '#5c7080',
	pub: 'rgba(92,112,128,0.35)',
	author: '#d9822b',
	manager: '#9179f2',
	both: '#d9822b',
};

const personKey = (name: string, slug: string | null | undefined) =>
	slug ? `person:slug:${slug}` : `person:name:${name}`;

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export function buildGraphData(orgData: OrgDataPayload): GraphData {
	const nodes: GraphNode[] = [];
	const links: GraphLink[] = [];
	const communityIdSet = new Set(orgData.communityStats.map((c) => c.id));

	// ── Person registry ──
	const personNodes = new Map<string, GraphNode>();
	const personRoles = new Map<string, Set<string>>();
	const personCommunities = new Map<string, Set<string>>();
	const personPubs = new Map<string, Set<string>>();

	const ensurePerson = (name: string, slug: string | null | undefined) => {
		const id = personKey(name, slug);
		if (!personNodes.has(id)) {
			personNodes.set(id, {
				id,
				label: name,
				type: 'person',
				role: 'author',
			});
			personRoles.set(id, new Set());
			personCommunities.set(id, new Set());
			personPubs.set(id, new Set());
		}
		return id;
	};

	// Register topAuthors
	for (const a of orgData.topAuthors) {
		const id = ensurePerson(a.name, a.slug);
		personRoles.get(id)!.add('author');
		for (const cid of a.communityIds) {
			if (communityIdSet.has(cid)) personCommunities.get(id)!.add(cid);
		}
	}

	// Register managers
	for (const c of orgData.communityStats) {
		if (c.managers) {
			for (const m of c.managers) {
				const id = ensurePerson(m.name, m.slug);
				personRoles.get(id)!.add('manager');
				personCommunities.get(id)!.add(c.id);
			}
		}
	}

	// Finalize person roles
	for (const [id, roles] of personRoles) {
		const node = personNodes.get(id)!;
		if (roles.has('author') && roles.has('manager')) {
			node.role = 'both';
		} else if (roles.has('manager')) {
			node.role = 'manager';
		} else {
			node.role = 'author';
		}
	}

	// ── Community nodes ──
	const communities: GraphNode[] = [];
	for (const c of orgData.communityStats) {
		const node: GraphNode = {
			id: `community:${c.id}`,
			label: c.title,
			type: 'community',
			accentColor: c.accentColorDark || '#137cbd',
			pubCount: c.pubCount,
		};
		nodes.push(node);
		communities.push(node);
	}

	// ── Pub nodes ──
	const pubs: GraphNode[] = [];
	const communityPubs = new Map<string, string[]>();
	for (const c of orgData.communityStats) {
		communityPubs.set(c.id, []);
	}

	for (const p of orgData.recentPubs) {
		if (!communityIdSet.has(p.communityId)) continue;
		const pubNode: GraphNode = {
			id: `pub:${p.id}`,
			label: p.title,
			type: 'pub',
			communityId: p.communityId,
		};
		nodes.push(pubNode);
		pubs.push(pubNode);
		communityPubs.get(p.communityId)?.push(p.id);

		links.push({
			source: `pub:${p.id}`,
			target: `community:${p.communityId}`,
			type: 'pub-community',
		});

		// Link pub authors to pub
		if (p.authors) {
			for (const a of p.authors) {
				const id = personKey(a.name, a.slug);
				if (personNodes.has(id)) {
					personPubs.get(id)!.add(p.id);
					links.push({
						source: id,
						target: `pub:${p.id}`,
						type: 'person-pub',
					});
				}
			}
		}
	}

	// ── Person nodes + manager→community links ──
	const people: GraphNode[] = [];
	for (const [id, node] of personNodes) {
		nodes.push(node);
		people.push(node);
		if (personRoles.get(id)!.has('manager')) {
			for (const cid of personCommunities.get(id)!) {
				if (communityIdSet.has(cid)) {
					links.push({
						source: id,
						target: `community:${cid}`,
						type: 'person-community',
					});
				}
			}
		}
	}

	// ── Community overlap (shared people) ──
	const communityOverlap = new Map<string, string[]>();
	for (const [personId, cids] of personCommunities) {
		if (cids.size < 2) continue;
		const arr = [...cids];
		const label = personNodes.get(personId)!.label;
		for (let i = 0; i < arr.length; i++) {
			for (let j = i + 1; j < arr.length; j++) {
				const key = pairKey(arr[i], arr[j]);
				if (!communityOverlap.has(key)) communityOverlap.set(key, []);
				communityOverlap.get(key)!.push(label);
			}
		}
	}

	return {
		nodes,
		links,
		communities,
		pubs,
		people,
		communityPubs,
		personCommunities,
		personPubs,
		communityOverlap,
	};
}
