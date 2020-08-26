import React from 'react';
import PropTypes from 'prop-types';

import { Icon, Byline, PubByline } from 'components';
import { pubShortUrl } from 'utils/canonicalUrls';
import { intersperse } from 'utils/arrays';
import { getRelationTypeName } from 'utils/pubEdge/relations';

require('./pubPreviewEdges.scss');

type referencedPubShape = {
    attributions?: any[];
};

// @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'any[] | und... Remove this comment to see the full error message
const referencedPubShape: PropTypes.Requireable<referencedPubShape> = PropTypes.shape({
    attributions: PropTypes.array,
});

type pubEdgeShape = {
    externalPublication?: any;
    pub?: referencedPubShape;
    pubId?: string;
    relationType?: string;
    targetPub?: referencedPubShape;
    targetPubId?: string;
};

// @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'referencedP... Remove this comment to see the full error message
const pubEdgeShape: PropTypes.Requireable<pubEdgeShape> = PropTypes.shape({
    externalPublication: PropTypes.object,
    pub: referencedPubShape,
    pubId: PropTypes.string,
    relationType: PropTypes.string,
    targetPub: referencedPubShape,
    targetPubId: PropTypes.string,
});

type Props = {
    accentColor: string;
    pubData: {
        inboundEdges?: pubEdgeShape[];
        outboundEdges?: pubEdgeShape[];
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
// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
					contributors={contributors}
// @ts-expect-error ts-migrate(2322) FIXME: Type '() => any' is not assignable to type 'never'... Remove this comment to see the full error message
					renderEmptyState={() => title}
				/>
			</a>
		);
	}
	const childPub = pubIsParent ? targetPub : pub;
	return (
		<a href={pubShortUrl(childPub)} key={edge.id} className="edge-link">
{/* @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'string | un... Remove this comment to see the full error message */}
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
