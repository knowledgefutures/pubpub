import React from 'react';

import { Icon, Byline, PubByline } from 'components';
import { pubShortUrl } from 'utils/canonicalUrls';
import { intersperse } from 'utils/arrays';
import { getRelationTypeName } from 'utils/pubEdge/relations';

require('./pubPreviewEdges.scss');

type ReferencedPub = {
	attributions: any[];
};

type PubEdge = {
	externalPublication?: {};
	pub?: ReferencedPub;
	pubId: string;
	relationType: string;
	targetPub?: ReferencedPub;
	targetPubId?: string;
};

type Props = {
	accentColor: string;
	pubData: {
		inboundEdges?: PubEdge[];
		outboundEdges?: PubEdge[];
	};
};

const sharedBylineProps = { bylinePrefix: null, truncateAt: 1, ampersand: true };

const getChildEdges = (pubData) => {
	const { inboundEdges, outboundEdges } = pubData;
	return [
		...inboundEdges.filter((edge) => {
			if (!edge.pubIsParent) {
				const { pub: sourcePub } = edge;
				if (sourcePub) {
					return sourcePub.communityId === pubData.communityId;
				}
			}
			return false;
		}),
		...outboundEdges.filter((edge) => edge.pubIsParent && edge.targetPub),
	];
};

const getEdgesByRelationType = (edges) => {
	const res = {};
	edges.forEach((edge) => {
		const { relationType } = edge;
		res[relationType] = res[relationType] || [];
		res[relationType].push(edge);
	});
	return res;
};

const renderEdgeLink = (edge) => {
	const { pubIsParent, targetPub, pub, externalPublication } = edge;
	if (externalPublication) {
		const { contributors, title, url } = externalPublication;
		return (
			<a href={url} key={edge.id} className="edge-link">
				<Byline
					{...sharedBylineProps}
					contributors={contributors}
					renderEmptyState={() => title}
				/>
			</a>
		);
	}
	const childPub = pubIsParent ? targetPub : pub;
	return (
		<a href={pubShortUrl(childPub)} key={edge.id} className="edge-link">
			<PubByline
				{...sharedBylineProps}
				pubData={childPub}
				linkToUsers={false}
				renderEmptyState={() => childPub.title}
			/>
		</a>
	);
};

const PubPreviewEdges = (props: Props) => {
	const { accentColor, pubData } = props;
	const childEdges = getChildEdges(pubData);

	if (childEdges.length === 0) {
		return null;
	}

	const categorizedEdges = getEdgesByRelationType(childEdges);

	return (
		<div className="pub-preview-edges-component">
			<div className="hairline" />
			<div className="heading" style={{ color: accentColor }}>
				<div className="icon-container">
					<Icon icon="layout-auto" iconSize={12} />
				</div>
				Connections
			</div>
			<div className="listing">
				{Object.keys(categorizedEdges)
					.sort()
					.map((relationType) => {
						const pluralName = getRelationTypeName(relationType, true);
						const edges = categorizedEdges[relationType];
						return (
							<div className="edge-list" key={`edge-list-${relationType}`}>
								<strong style={{ color: accentColor }}>
									{pluralName} ({edges.length}):
								</strong>
								&nbsp;
								{intersperse(edges.map(renderEdgeLink), ' • ')}
							</div>
						);
					})}
			</div>
		</div>
	);
};
export default PubPreviewEdges;
