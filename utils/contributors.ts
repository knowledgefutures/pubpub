import { Attribution, AttributionWithUser, Collection, Pub } from 'types';
import ensureUserForAttribution from 'utils/ensureUserForAttribution';
import { joinOxford } from 'utils/strings';
import { unique } from 'utils/arrays';
import { getPrimaryCollection } from 'utils/collections/primary';

const orderedContributors = (maybeContributors: Attribution[] | undefined | null) =>
	(maybeContributors || []).concat().sort((a, b) => {
		if (a.order !== b.order) {
			return a.order - b.order;
		}
		if (a.createdAt && b.createdAt && b.createdAt !== a.createdAt) {
			return b.createdAt.toString() > a.createdAt.toString() ? 1 : -1;
		}
		return 0;
	});

const editorRoles = ['Editor', 'Writing – Review & Editing'];
const illustratorRoles = ['Illustrator', 'Visualization'];
const otherKnownRoles = ['Translator', 'Series Editor', 'Chair'];
const rolesNotAssignedToOtherEntries = editorRoles.concat(illustratorRoles, otherKnownRoles);

const getPrimaryRole = (contributor: AttributionWithUser) =>
	contributor.roles ? contributor.roles[0] : '';

const resolveContributors = (
	contributors: AttributionWithUser[],
	hideAuthors: boolean,
	hideNonAuthors: boolean,
) => {
	const outputContributors = contributors.filter((attribution) => {
		if (hideAuthors && attribution.isAuthor) {
			return false;
		}
		if (hideNonAuthors && !attribution.isAuthor) {
			return false;
		}
		return true;
	});

	// Filter contributors to remove duplicates of the same user with the same roles. This can
	// happen when a user is specified as an author at both the Collection and Pub level. But,
	// we don't want de-dupe the same user when they appear multiple times with different roles.
	return unique(outputContributors, (attr, isUnique) => {
		if (attr.user) {
			return JSON.stringify({
				userId: attr.user.id,
				roles: (attr.roles ?? []).sort((a, b) => a.localeCompare(b)),
			});
		}
		// Never de-dupe attributions without users.
		return isUnique;
	});
};

export const getAllPubContributors = (
	pubData: Pub,
	role: string,
	hideAuthors = false,
	hideNonAuthors = false,
) => {
	const { collectionPubs } = pubData;
	const primaryCollection = collectionPubs && getPrimaryCollection(collectionPubs);

	const contributors = [
		...orderedContributors(pubData.attributions),
		...orderedContributors(primaryCollection && primaryCollection.attributions),
	].map(ensureUserForAttribution);

	if (role === 'contributors') {
		return resolveContributors(contributors, hideAuthors, hideNonAuthors);
	}

	if (role === 'author') {
		const contributorsWithRoles = contributors.filter((contributor) => {
			return (
				!contributor.roles ||
				!rolesNotAssignedToOtherEntries.includes(getPrimaryRole(contributor))
			);
		});
		return resolveContributors(contributorsWithRoles, hideAuthors, hideNonAuthors);
	}

	if (role === 'editor') {
		const contributorsWithRoles = contributors.filter((contributor) => {
			return editorRoles.includes(getPrimaryRole(contributor));
		});
		return resolveContributors(contributorsWithRoles, hideAuthors, hideNonAuthors);
	}
	if (role === 'illustrator') {
		const contributorsWithRoles = contributors.filter((contributor) => {
			return illustratorRoles.includes(getPrimaryRole(contributor));
		});

		return resolveContributors(contributorsWithRoles, hideAuthors, hideNonAuthors);
	}
	const contributorsWithRoles = contributors.filter((contributor) => {
		return getPrimaryRole(contributor) === role;
	});
	return resolveContributors(contributorsWithRoles, hideAuthors, hideNonAuthors);
};

export const getAllCollectionContributors = (
	collectionData: Collection,
	hideAuthors = false,
	hideNonAuthors = false,
) => {
	return resolveContributors(
		orderedContributors(collectionData.attributions).map(ensureUserForAttribution),
		hideAuthors,
		hideNonAuthors,
	);
};

export const getContributorName = (attribution: Attribution) => {
	if (attribution.user) {
		return attribution.user.fullName;
	}
	return attribution.name;
};

export const getAuthorString = (pub) => {
	const contributors = getAllPubContributors(pub, 'author', false, true);
	return joinOxford(contributors.map((c) => c.user.fullName));
};
