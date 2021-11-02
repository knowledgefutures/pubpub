/* eslint-disable no-restricted-syntax */
import BluebirdPromise from 'bluebird';

import {
	resolveCommunityDirective,
	resolveCollectionDirective,
	resolvePubDirective,
} from './directives';
import { BulkImportError } from './errors';

const resolveDirective = async ({ directive, actor, targetPath, parents }) => {
	const { community, collection } = parents;
	if (directive.type === 'community') {
		if (community) {
			throw new BulkImportError(
				{ directive, path: targetPath },
				'Cannot create a Community when one is already defined in scope.',
			);
		}
		const resolved = await resolveCommunityDirective({ directive, actor });
		return { resolved, parents: { community: resolved.community } };
	}
	if (directive.type === 'collection') {
		if (!community) {
			throw new BulkImportError(
				{ directive, path: targetPath },
				'Cannot create a Collection without a parent Community.',
			);
		}
		const resolved = await resolveCollectionDirective({
			directive,
			community,
		});
		return { resolved, parents: { collection: resolved.collection } };
	}
	if (directive.type === 'pub') {
		if (!community) {
			throw new BulkImportError(
				{ directive, path: targetPath },
				'Cannot create a Pub without a parent Community.',
			);
		}
		const resolved = await resolvePubDirective({
			directive,
			targetPath,
			community,
			collection,
		});
		return { resolved };
	}
	throw new BulkImportError({ directive }, `Cannot resolve directive of type ${directive.type}`);
};

export const resolveImportPlan = async ({ importPlan, actor, parents }) => {
	let currentParents = { ...parents };
	const { directives, path, children } = importPlan;
	const resolvedValues = [];

	for (const directive of directives) {
		try {
			// eslint-disable-next-line no-await-in-loop
			const { resolved, parents: nextParents } = await resolveDirective({
				directive,
				actor,
				targetPath: path,
				parents: currentParents,
			});
			// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ community: any; created: any; ... Remove this comment to see the full error message
			resolvedValues.push(resolved);
			currentParents = { ...currentParents, ...nextParents };
		} catch (error) {
			if (error instanceof Error) {
				// eslint-disable-next-line no-console
				console.log(error.stack);
				// @ts-expect-error ts-migrate(2322) FIXME: Type '{}' is not assignable to type 'never'.
				resolvedValues.push({ resolved: {}, error: error && error.stack });
			}
		}
	}

	if (children && children.length > 0) {
		const resolvedChildPlans = await BluebirdPromise.mapSeries(children, (childPlan) =>
			resolveImportPlan({ importPlan: childPlan, actor, parents: currentParents }),
		);
		return { ...importPlan, resolved: resolvedValues, children: resolvedChildPlans };
	}

	return { ...importPlan, resolved: resolvedValues };
};
