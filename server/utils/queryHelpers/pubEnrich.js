import { buildSchema, jsonToNode, getNotes } from '@pubpub/editor';
import discussionSchema from 'containers/Pub/PubDocument/DiscussionAddon/discussionSchema';
import { getBranchDoc, getFirebaseToken } from '../firebaseAdmin';
import { Branch } from '../../models';
import { generateCiteHtmls } from '../../editor/queries';
import { generateCitationHTML } from '../citations';

export const enrichPubFirebaseDoc = async (pubData, historyKey, branchType) => {
	const activeBranch = pubData.branches.find((branch) => {
		return branch.title === branchType;
	});
	if (!activeBranch) {
		throw new Error('Pub Not Found');
	}
	const { content, historyData, mostRecentRemoteKey, checkpointUpdates } = await getBranchDoc(
		pubData.id,
		activeBranch.id,
		historyKey,
		true,
	);
	let setFirstKeyAt;
	let setLatestKeyAt;
	if (checkpointUpdates) {
		const whereQuery = { where: { id: activeBranch.id } };
		if (activeBranch.firstKeyAt) {
			setFirstKeyAt = Branch.update({ firstKeyAt: checkpointUpdates.firstKeyAt }, whereQuery);
		}
		if (new Date(activeBranch.latestKeyAt) > checkpointUpdates.latestKeyAt) {
			setLatestKeyAt = Branch.update(
				{ latestKeyAt: checkpointUpdates.latestKeyAt },
				whereQuery,
			);
		}
	}
	await setFirstKeyAt;
	await setLatestKeyAt;

	return {
		...pubData,
		activeBranch: activeBranch,
		initialDoc: content,
		initialDocKey: mostRecentRemoteKey,
		historyData: historyData,
	};
};

export const enrichPubFirebaseToken = async (pubData, initialData) => {
	const {
		canView,
		canViewDraft,
		canEdit,
		canEditDraft,
		canManage,
	} = initialData.scopeData.activePermissions;
	const firebaseToken = await getFirebaseToken(initialData.loginData.id || 'anon', {
		branchId: `branch-${pubData.activeBranch.id}`,
		canEditBranch: canEdit || canEditDraft,
		canViewBranch: canView || canViewDraft,
		canDiscussBranch: pubData.activeBranch.canDiscuss,
		canManage: canManage,
		userId: initialData.loginData.id,
	});
	return {
		...pubData,
		firebaseToken: firebaseToken,
	};
};

export const enrichPubCitations = async (pubData, initialData) => {
	const { initialDoc } = pubData;
	const { footnotes: footnotesRaw, citations: citationsRaw } = initialDoc
		? getNotes(jsonToNode(initialDoc, buildSchema({ ...discussionSchema }, {})))
		: { footnotes: [], citations: [] };

	const footnotesData = await generateCiteHtmls(footnotesRaw);
	const citationsData = await generateCiteHtmls(citationsRaw);
	const citationHtml = await generateCitationHTML(pubData, initialData.communityData);

	return {
		...pubData,
		footnotes: footnotesData,
		citations: citationsData,
		citationData: citationHtml,
	};
};
