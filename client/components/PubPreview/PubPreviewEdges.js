import React from 'react';
import PropTypes from 'prop-types';

import { Icon, Byline, PubByline } from 'components';
import { pubShortUrl } from 'utils/canonicalUrls';
import { intersperse } from 'utils/arrays';
import { getRelationTypeName } from 'utils/pubEdge/relations';

require('./pubPreviewEdges.scss');

const referencedPubShape = PropTypes.shape({
	attributions: PropTypes.array,
});

const pubEdgeShape = PropTypes.shape({
	externalPublication: PropTypes.object,
	pub: referencedPubShape,
	pubId: PropTypes.string,
	relationType: PropTypes.bool,
	targetPub: referencedPubShape,
	targetPubId: PropTypes.string,
});

const propTypes = {
	accentColor: PropTypes.string.isRequired,
	pubData: PropTypes.shape({
		inboundEdges: PropTypes.arrayOf(pubEdgeShape),
		outboundEdges: PropTypes.arrayOf(pubEdgeShape),
	}).isRequired,
};

const sharedBylineProps = { bylinePrefix: null, truncateAt: 1, ampersand: true };

const getChildEdges = (pubData) => {
	const { inboundEdges, outboundEdges } = pubData;
	return [
		...inboundEdges.filter((edge) => {
			if (edge.targetIsParent) {
				const { pub: sourcePub } = edge;
				if (sourcePub) {
					return sourcePub.communityId === pubData.communityId;
				}
			}
			return false;
		}),
		...outboundEdges.filter((edge) => !edge.targetIsParent),
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
	const { targetIsParent, targetPub, pub, externalPublication } = edge;
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
	const childPub = targetIsParent ? pub : targetPub;
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

const PubPreviewEdges = (props) => {
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
					.sort((a, b) => a - b)
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

PubPreviewEdges.propTypes = propTypes;
export default PubPreviewEdges;
