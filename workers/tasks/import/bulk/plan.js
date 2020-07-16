import fs from 'fs-extra';
import path from 'path';
import YAML from 'yaml';

import { directiveFileSuffix } from './constants';
import { pathMatchesPattern } from './paths';

const createDirectiveCounter = () => {
	let i = 0;
	return {
		count: () => {
			const res = i;
			++i;
			return res;
		},
	};
};

const throwConflictingDirectiveError = (first, second, filePath) => {
	const message = `
        Found conflicting directive types for ${filePath}:
            '${first.type}' in ${first.path}
            '${second.type}' in ${second.path}
    `;
	throw new Error(message);
};

const throwInvalidDirectiveTypeError = (directives, allowedTypes, filePath) => {
	const message = `
    Found invalid directive types for ${filePath} (expected ${allowedTypes.map((t) => `'${t}'`)}):
    ${directives.map((d) => `\t'${d.type}' in ${d.path}`).join('\n')}`;
	throw new Error(message);
};

const maybeThrowNestedCollectionError = (matchedDirectives) => {
	const collections = matchedDirectives.filter((d) => d.type === 'collection');
	if (collections.length > 1) {
		const message = `
        Found illegally nested collection directives:
            in ${collections[0].$meta.source}
            in ${collections[1].$meta.source}
        `;
		throw new Error(message);
	}
};

const checkDirectiveForRequiredKeys = (directive) => {
	const { type, title, create, slug, subdomain } = directive;
	if (type === 'pub') {
		return;
	}
	if (create && !title) {
		throw new Error(
			`Directive ${directive.$meta.source} would create a new ${type} and requires a 'title'`,
		);
	}
	if (type === 'community' && !create && !subdomain) {
		throw new Error(
			`Directive ${directive.$meta.source} will look up a Community and requires a 'subdomain'.` +
				` Specify 'create: true' to create a new Community instead.`,
		);
	}
	if (type === 'collection' && !create && !slug) {
		throw new Error(
			`Directive ${directive.$meta.source} will look up a Collection and requires a 'slug'.` +
				` Specify 'create: true' to create a new Collection instead.`,
		);
	}
};

const sortPlansByPubDirectiveOrder = (plans) => {
	const map = new Map();
	plans.forEach((plan) => {
		const pubDirectives = plan.directives.filter((d) => d.type === 'pub');
		map.set(plan, pubDirectives.length ? pubDirectives[0].$meta.order : Infinity);
	});
	return plans.concat().sort((a, b) => map.get(a) - map.get(b));
};

const pathMatchesDirective = (filePath, directive) => {
	const {
		$meta: { merged, match, source },
	} = directive;
	if (merged) {
		throw new Error(`Cannot match against directive ${source}`);
	}
	return pathMatchesPattern(filePath, match);
};

const mergeDirectives = (directives) => {
	if (directives.every((directive) => directive.partial)) {
		return [];
	}
	if (directives.length <= 1) {
		return directives;
	}

	const $meta = {
		// Take `name` from the directive closest to its target in the filesystem
		name: directives[directives.length - 1].$meta.name,
		order: directives
			.map((directive) => directive.$meta.order)
			.reduce((a, b) => Math.max(a, b), -Infinity),
		source: `merged from ${directives.map((d) => d.$meta.source).join(', ')}`,
		merged: directives,
	};
	return [
		{
			...directives.reduce((a, b) => ({ ...a, ...b }), {}),
			attributions: directives
				.map((directive) => directive.attributions || [])
				.reduce((a, b) => [...a, ...b], []),
			resolve: directives
				.map((directive) => directive.resolve || [])
				.reduce((a, b) => [...a, ...b], []),
			$meta: $meta,
		},
	];
};

const mergeDirectivesByType = (directives) => {
	const pubs = directives.filter((d) => d.type === 'pub');
	const collections = directives.filter((d) => d.type === 'collection');
	const communities = directives.filter((d) => d.type === 'community');
	// Scope order is important to maintain here, so that we can specify higher scopes and lower
	// scopes in the same directory, and they will be resolved in the right order.
	return [
		...mergeDirectives(communities),
		...mergeDirectives(collections),
		...mergeDirectives(pubs),
	];
};

const matchDirectivesToPath = async (filePath, directives) => {
	const matchingDirectives = directives.filter((directive) =>
		pathMatchesDirective(filePath, directive),
	);
	matchingDirectives.forEach(checkDirectiveForRequiredKeys);
	if (matchingDirectives.length > 1) {
		const pub = matchingDirectives.find((d) => d.type === 'pub');
		const collection = matchingDirectives.find((d) => d.type === 'collection');
		if (pub && collection) {
			throwConflictingDirectiveError(pub, collection, filePath);
		}
	}
	return mergeDirectivesByType(matchingDirectives);
};

const extractDirectives = (matchingPath, directivePath, directive, directiveCounter) => {
	if (!directive) {
		return [];
	}
	if (directive && !directive.type) {
		throw new Error(
			`${directivePath} must specify a type: 'pub', 'collection', or 'community'`,
		);
	}
	const directives = [
		{
			...directive,
			$meta: {
				source: directivePath,
				match: matchingPath,
				name: path.basename(matchingPath),
				order: directiveCounter.count(),
			},
		},
	];
	if (directive.children) {
		Object.entries(directive.children).forEach(([matchingSubPath, subdirective]) => {
			directives.push(
				...extractDirectives(
					path.join(matchingPath, matchingSubPath),
					directivePath,
					subdirective,
					directiveCounter,
				),
			);
		});
	}
	return directives;
};

const getDirectivesFromFiles = async (directory, files, directiveCounter) => {
	const directiveFiles = files.filter((fileName) => fileName.endsWith(directiveFileSuffix));
	const directives = await Promise.all(
		directiveFiles.map(async (fileName) => {
			const directivePath = path.join(directory, fileName);
			const contents = await fs.readFile(directivePath);
			const directive = YAML.parse(contents.toString());
			return extractDirectives(directory, directivePath, directive, directiveCounter);
		}),
	).then((res) => res.reduce((a, b) => [...a, ...b], []));
	return { directiveFiles: directiveFiles, directives: directives };
};

export const buildImportPlan = (rootDirectory) => {
	const directiveCounter = createDirectiveCounter();

	const visitFile = async (filePath, directives) => {
		const matchingDirectives = await matchDirectivesToPath(filePath, directives);
		const invalidDirectives = matchingDirectives.filter((d) => d.type !== 'pub');
		if (invalidDirectives.length > 0) {
			throwInvalidDirectiveTypeError(invalidDirectives, ['pub'], filePath);
		}
		if (matchingDirectives.length > 0) {
			return {
				path: filePath,
				type: 'file',
				directives: matchingDirectives,
			};
		}
		return null;
	};

	const visitDirectory = async (directoryPath, parentDirectives = []) => {
		const files = await fs.readdir(directoryPath);
		const { directives, directiveFiles } = await getDirectivesFromFiles(
			directoryPath,
			files,
			directiveCounter,
		);
		const nextDirectives = [...parentDirectives, ...directives];
		const matchedDirectives = await matchDirectivesToPath(directoryPath, nextDirectives);
		maybeThrowNestedCollectionError(matchedDirectives);
		const plan = {
			path: directoryPath,
			type: 'directory',
			directives: matchedDirectives,
		};
		const childPlans = await Promise.all(
			files
				.filter((f) => !directiveFiles.includes(f))
				.map(async (filePath) => {
					const fullPath = path.join(directoryPath, filePath);
					const stat = await fs.lstat(fullPath);
					if (stat.isDirectory()) {
						return visitDirectory(fullPath, nextDirectives);
					}
					return visitFile(fullPath, nextDirectives);
				}),
		).then((arr) => arr.filter((x) => x));
		if (childPlans.length > 0) {
			return { ...plan, children: sortPlansByPubDirectiveOrder(childPlans) };
		}
		if (plan.directives.length > 0) {
			return plan;
		}
		return null;
	};

	return visitDirectory(rootDirectory);
};

export const printImportPlan = (importPlan, { verb = 'CREATE' } = {}) => {
	// eslint-disable-next-line no-param-reassign
	verb = verb.toUpperCase();
	const printInner = (plan, depth) => {
		const { directives, children } = plan;
		const prefix = ' '.repeat(depth * 4);
		const indent = '  ';

		const childResults = (children || []).map((child) => printInner(child, depth + 1)).join('');
		const shouldPrint = directives.length > 0 || childResults;

		if (!shouldPrint) {
			return '';
		}

		const lines = [];
		const log = (str) => {
			lines.push(str);
		};

		log(`${prefix}[${plan.type}] ${plan.path}`);

		if (directives.length > 0) {
			directives.forEach((directive, index) => {
				const { type, create, slug, subdomain, title } = directive;
				const resolvedByDirective = plan.resolved && plan.resolved[index];
				const sharedPrefix = `${prefix}${indent}`;
				if (type === 'pub') {
					const effectiveTitle =
						(resolvedByDirective &&
							resolvedByDirective.pub &&
							resolvedByDirective.pub.title) ||
						title ||
						'(to be derived)';
					log(`${sharedPrefix}${verb} PUB title=${effectiveTitle}`);
				}
				if (type === 'collection') {
					const specifier = create
						? `${verb} COLLECTION title=${title}`
						: `EXISTING COLLECTION slug=${slug}`;
					log(`${sharedPrefix}${specifier}`);
				}
				if (type === 'community') {
					const specifier = create
						? `${verb} COMMUNITY title=${title}`
						: `EXISTING COMMUNITY subdomain=${subdomain}`;
					log(`${sharedPrefix}${specifier}`);
				}
			});
		}
		log(childResults);
		const output = lines.join('\n');
		if (depth === 0) {
			// eslint-disable-next-line no-console
			console.log(output);
		}
		return output;
	};
	return printInner(importPlan, 0);
};

export const getCreatedItemsFromPlan = (importPlan) => {
	const { resolved, children } = importPlan;
	const communities = [];
	const collections = [];
	const pubs = [];
	if (resolved) {
		resolved.forEach((entry) => {
			const { community, pub, collection, created } = entry;
			if (created) {
				if (community) {
					communities.push(community);
				}
				if (collection) {
					if (Array.isArray(collection)) {
						collections.push(...collection);
					} else {
						collections.push(collection);
					}
				}
				if (pub) {
					pubs.push(pub);
				}
			}
		});
	}
	if (children) {
		const childItems = children.map(getCreatedItemsFromPlan);
		childItems.forEach((child) => {
			communities.push(...child.communities);
			collections.push(...child.collections);
			pubs.push(...child.pubs);
		});
	}
	return { communities: communities, collections: collections, pubs: pubs };
};
