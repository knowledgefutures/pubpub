import React from 'react';

import { Icon, Byline, PubByline } from 'components';
import { InitialCommunityData, Pub, PubEdge } from 'types';
import { pubShortUrl, pubUrl } from 'utils/canonicalUrls';
import { intersperse } from 'utils/arrays';
import { getRelationTypeName } from 'utils/pubEdge/relations';
import { usePageContext } from 'utils/hooks';

require('./pubPreviewEdges.scss');

type Props = {
	accentColor: string;
	pubData: Pub;
};

const sharedBylineProps = { bylinePrefix: null, truncateAt: 1, ampersand: true };

const getChildEdges = (pubData: Pub) => {
	const { inboundEdges = [], outboundEdges = [] } = pubData;
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
		...outboundEdges.filter((edge) => edge.pubIsParent),
	];
};

const getEdgesByRelationType = (edges: PubEdge[]): Record<string, PubEdge[]> => {
	const res = {};
	edges.forEach((edge) => {
		const { relationType } = edge;
		res[relationType] = res[relationType] || [];
		res[relationType].push(edge);
	});
	return res;
};

const renderEdgeLink = (
	edge: PubEdge,
	communityData: InitialCommunityData,
	renderTitle = false,
) => {
	const { pubIsParent, targetPub, pub, externalPublication } = edge;
	if (externalPublication) {
		const { contributors, title, url } = externalPublication;
		return (
			<a href={url} key={edge.id} className="edge-link">
				{renderTitle ? (
					title
				) : (
					<Byline
						{...sharedBylineProps}
						contributors={contributors ?? []}
						renderEmptyState={() => title}
					/>
				)}
			</a>
		);
	}
	const childPub = (pubIsParent ? targetPub : pub) as Pub;
	const href =
		childPub.communityId === communityData.id
			? pubUrl(communityData, childPub)
			: pubShortUrl(childPub);

	return (
		<a href={href} key={edge.id} className="edge-link">
			{renderTitle ? (
				childPub.title
			) : (
				<PubByline
					{...sharedBylineProps}
					pubData={childPub}
					linkToUsers={false}
					renderEmptyState={() => childPub.title}
				/>
			)}
		</a>
	);
};

const PubPreviewEdges = (props: Props) => {
	const { communityData } = usePageContext();

	const { accentColor, pubData } = props;
	const childEdges = getChildEdges(pubData);

	if (childEdges.length === 0) {
		return null;
	}

	const categorizedEdges = getEdgesByRelationType(childEdges);
	// Show title, not author, if it's Arcadia.
	// TODO: Add this as a community-wide connection setting.
	const isArcadia = communityData.id === '1a71ef4d-f6fe-40d3-8379-42fa2141db58';

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
								{intersperse(
									edges.map((edge) => {
										return renderEdgeLink(edge, communityData, isArcadia);
									}),
									' • ',
								)}
							</div>
						);
					})}
			</div>
		</div>
	);
};
export default PubPreviewEdges;
