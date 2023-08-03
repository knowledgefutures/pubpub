import { Op } from 'sequelize';

import { Doc, Draft, PubEdge } from 'server/models';
import { generateCitationHtml, getStructuredCitationsForPub } from 'server/utils/citations';
import { getPubDraftDoc, getFirebaseToken } from 'server/utils/firebaseAdmin';
import { Pub as PubType, DefinitelyHas, PubDocInfo, InitialData, SanitizedPubData } from 'types';

import { sanitizePubEdge } from './sanitizePubEdge';
import { getPubEdgeIncludes } from './pubEdgeOptions';

export const getPubFirebaseDraft = async (
	pubData: SanitizedPubData,
	historyKey: null | number,
): Promise<PubDocInfo> => {
	const { doc, historyData, mostRecentRemoteKey, latestTimestamp } = await getPubDraftDoc(
		pubData.id,
		historyKey,
	);
	if (latestTimestamp && pubData.draft) {
		await Draft.update(
			{ latestKeyAt: new Date(latestTimestamp) },
			{ where: { id: pubData.draft.id } },
		);
	}

	return {
		initialDoc: doc,
		initialDocKey: mostRecentRemoteKey,
		historyData,
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

export const getPubFirebaseToken = async (pubData: SanitizedPubData, initialData: InitialData) => {
	const { canView, canViewDraft, canEdit, canEditDraft } =
		initialData.scopeData.activePermissions;
	const firebaseToken = await getFirebaseToken(initialData.loginData.id || 'anon', {
		canEdit: canEdit || canEditDraft,
		canView: canView || canViewDraft,
		draftPath: pubData.draft?.firebasePath!,
	});
	return {
		firebaseToken,
	};
};

export const getPubCitations = async (pubData, initialData, initialDoc) => {
	const {
		communityData,
		scopeData: { facets },
	} = initialData;
	const citationStyleFacet = facets!.CitationStyle.value!;
	const [initialStructuredCitations, citationHtml] = await Promise.all([
		getStructuredCitationsForPub(citationStyleFacet, initialDoc),
		generateCitationHtml(pubData, communityData, citationStyleFacet.citationStyle),
	]);

	return {
		initialStructuredCitations,
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
