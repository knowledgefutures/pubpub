import { Op } from 'sequelize';

import { jsonToNode } from 'client/components/Editor/utils/doc';
import { Branch, Doc, PubEdge } from 'server/models';
import { generateCitationHtml, getStructuredCitationsForPub } from 'server/utils/citations';
import { getBranchDoc, getFirebaseToken, editorSchema } from 'server/utils/firebaseAdmin';

import { sanitizePubEdge } from './sanitizePubEdge';
import { getPubEdgeIncludes } from './pubEdgeOptions';

const getDocContentForBranch = async (
	pubData,
	branchData,
	versionNumber,
	restoreDiscussionMaps,
) => {
	const { maintenanceDocId } = branchData;
	if (maintenanceDocId) {
		const doc = await Doc.findOne({ where: { id: maintenanceDocId } });
		return {
			doc: doc.content,
			historyData: {
				timestamps: {},
				currentKey: -1,
				latestKey: -1,
			},
			mostRecentRemoteKey: -1,
		};
	}
	return getBranchDoc(pubData.id, branchData.id, versionNumber, true, restoreDiscussionMaps);
};

export const enrichPubFirebaseDoc = async (pubData, versionNumber, branchType) => {
	const activeBranch = pubData.branches.find((branch) => {
		return branch.title === branchType;
	});
	if (!activeBranch) {
		throw new Error('Pub Not Found');
	}

	const {
		doc,
		historyData,
		mostRecentRemoteKey,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'firstTimestamp' does not exist on type '... Remove this comment to see the full error message
		firstTimestamp,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'latestTimestamp' does not exist on type ... Remove this comment to see the full error message
		latestTimestamp,
	} = await getDocContentForBranch(pubData, activeBranch, versionNumber, branchType === 'draft');

	if (firstTimestamp || latestTimestamp) {
		const update = {
			...(firstTimestamp && { firstKeyAt: new Date(firstTimestamp) }),
			...(latestTimestamp && { latestKeyAt: new Date(latestTimestamp) }),
		};
		await Branch.update(update, { where: { id: activeBranch.id } });
	}

	return {
		...pubData,
		isInMaintenanceMode: !!activeBranch.maintenanceDocId,
		activeBranch: activeBranch,
		initialDoc: doc,
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
		canViewBranch: canView || canViewDraft || pubData.isRelease,
		canManage: canManage,
		userId: initialData.loginData.id,
	});
	return {
		...pubData,
		firebaseToken: firebaseToken,
	};
};

export const enrichPubCitations = async (pubData, initialData) => {
	const [initialStructuredCitations, citationHtml] = await Promise.all([
		getStructuredCitationsForPub(pubData, jsonToNode(pubData.initialDoc, editorSchema)),
		generateCitationHtml(pubData, initialData.communityData),
	]);

	return {
		...pubData,
		initialStructuredCitations: initialStructuredCitations,
		citationData: citationHtml,
	};
};

export const enrichAndSanitizePubEdges = async (pubData, initialData) => {
	const { inboundEdges, outboundEdges } = pubData;
	const sanitizeEdgeHere = (edge) => sanitizePubEdge(initialData, edge);

	const sanitizedInboundEdges = inboundEdges.map(sanitizeEdgeHere).filter((x) => x);
	const sanitizedOutboundEdges = outboundEdges.map(sanitizeEdgeHere).filter((x) => x);

	const parentPubIds = [
		...sanitizedOutboundEdges
			.filter((edge) => !edge.pubIsParent)
			.map((edge) => edge.targetPubId),
		...sanitizedInboundEdges.filter((edge) => edge.pubIsParent).map((edge) => edge.pubId),
	];

	const edgeIds = [...inboundEdges, ...outboundEdges].map((edge) => edge.id);

	const siblingEdges = await PubEdge.findAll({
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ includePub: boolean; includeTa... Remove this comment to see the full error message
		include: getPubEdgeIncludes({ includePub: true, includeTargetPub: true }),
		where: {
			id: { [Op.notIn]: edgeIds },
			[Op.or]: [
				{
					pubIsParent: false,
					targetPubId: { [Op.in]: parentPubIds },
					approvedByTarget: true,
				},
				{
					pubIsParent: true,
					pubId: { [Op.in]: parentPubIds },
					approvedByTarget: true,
				},
			],
		},
	});

	return {
		...pubData,
		inboundEdges: sanitizedInboundEdges,
		outboundEdges: sanitizedOutboundEdges,
		siblingEdges: siblingEdges.map((edge) => sanitizeEdgeHere(edge.toJSON())).filter((x) => x),
	};
};
