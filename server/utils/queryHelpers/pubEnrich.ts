import { Op } from 'sequelize';

import { jsonToNode } from 'client/components/Editor/utils/doc';
import { Branch, Doc, PubEdge } from 'server/models';
import { generateCitationHtml, getStructuredCitationsForPub } from 'server/utils/citations';
import { getBranchDoc, getFirebaseToken, editorSchema } from 'server/utils/firebaseAdmin';
import { Pub as PubType, Branch as BranchType, DefinitelyHas, PubDocInfo } from 'utils/types';

import { SanitizedPubData } from './pubSanitize';
import { sanitizePubEdge } from './sanitizePubEdge';
import { getPubEdgeIncludes } from './pubEdgeOptions';

const getDocContentForBranch = async (pubData, branchData, versionNumber) => {
	const { maintenanceDocId } = branchData;
	if (maintenanceDocId) {
		const doc = await Doc.findOne({ where: { id: maintenanceDocId } });
		return {
			firstTimestamp: null,
			latestTimestamp: null,
			doc: doc.content,
			historyData: {
				timestamps: {},
				currentKey: -1,
				latestKey: -1,
			},
			mostRecentRemoteKey: -1,
		};
	}
	return getBranchDoc(pubData.id, branchData.id, versionNumber, true);
};

export const getPubFirebaseDraft = async (
	pubData: SanitizedPubData,
	activeBranch: BranchType,
	historyKey: null | number,
): Promise<PubDocInfo & { isInMaintenanceMode: boolean }> => {
	const {
		doc,
		historyData,
		mostRecentRemoteKey,
		firstTimestamp,
		latestTimestamp,
	} = await getDocContentForBranch(pubData, activeBranch, historyKey);

	if (firstTimestamp || latestTimestamp) {
		const update = {
			...(firstTimestamp && { firstKeyAt: new Date(firstTimestamp) }),
			...(latestTimestamp && { latestKeyAt: new Date(latestTimestamp) }),
		};
		await Branch.update(update, { where: { id: activeBranch.id } });
	}

	return {
		isInMaintenanceMode: !!activeBranch.maintenanceDocId,
		initialDoc: doc,
		initialDocKey: mostRecentRemoteKey,
		historyData: historyData,
	};
};

export const getPubRelease = async (
	pubData: DefinitelyHas<PubType, 'releases'>,
	releaseNumber: null | number,
): Promise<PubDocInfo> => {
	const resolvedReleaseNumber = releaseNumber || pubData.releases.length;
	const release = pubData.releases[resolvedReleaseNumber - 1];
	if (!release) {
		throw new Error('Release not found');
	}
	const { historyKey, docId } = release;
	const doc = await Doc.findOne({ where: { id: docId } });
	return {
		initialDoc: doc.content,
		initialDocKey: historyKey,
		historyData: {
			latestKey: historyKey,
			currentKey: historyKey,
			timestamps: {},
		},
	};
};

export const getPubFirebaseToken = async (pubData, activeBranch, initialData) => {
	const {
		canView,
		canViewDraft,
		canEdit,
		canEditDraft,
		canManage,
	} = initialData.scopeData.activePermissions;
	const firebaseToken = await getFirebaseToken(initialData.loginData.id || 'anon', {
		branchId: `branch-${activeBranch.id}`,
		canEditBranch: canEdit || canEditDraft,
		canViewBranch: canView || canViewDraft || pubData.isRelease,
		canManage: canManage,
		userId: initialData.loginData.id,
	});
	return {
		firebaseToken: firebaseToken,
	};
};

export const getPubCitations = async (pubData, initialData, initialDoc) => {
	const [initialStructuredCitations, citationHtml] = await Promise.all([
		getStructuredCitationsForPub(pubData, jsonToNode(initialDoc, editorSchema)),
		generateCitationHtml(pubData, initialData.communityData),
	]);

	return {
		initialStructuredCitations: initialStructuredCitations,
		citationData: citationHtml,
	};
};

export const getPubEdges = async (pubData, initialData) => {
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
		inboundEdges: sanitizedInboundEdges,
		outboundEdges: sanitizedOutboundEdges,
		siblingEdges: siblingEdges.map((edge) => sanitizeEdgeHere(edge.toJSON())).filter((x) => x),
	};
};
