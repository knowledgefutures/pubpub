import { Icon } from '@blueprintjs/core';
import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import { PubEdge } from 'components';
import { toTitleCase } from 'utils/strings';
import { usePageContext } from 'utils/hooks';
import { relationTypeDefinitions } from 'utils/pubEdge';

import { pubEdgeType } from '../PubEdge/constants';

require('./pubEdgeListingCard.scss');

const propTypes = {
	accentColor: PropTypes.string,
	children: PropTypes.node,
	inPubBody: PropTypes.bool,
	pubEdge: pubEdgeType.isRequired,
	pubTitle: PropTypes.string,
	showIcon: PropTypes.bool,
	viewingFromSibling: PropTypes.bool,
};

const defaultProps = {
	accentColor: null,
	children: [],
	inPubBody: false,
	pubTitle: null,
	showIcon: false,
	viewingFromSibling: false,
};

const PubEdgeListingCard = (props) => {
	const {
		accentColor,
		children,
		inPubBody,
		pubEdge,
		pubTitle,
		showIcon,
		viewingFromSibling,
	} = props;
	const { communityData } = usePageContext();
	// If `pub` is defined on the edge, that probably means we queried it as an inboundEdge
	// and we're looking at it from the perspective of the target Pub, rather than the Pub
	// that created the edge.
	const viewingFromTarget = !!pubEdge.pub;

	const renderRelation = () => {
		const { relationType, pubIsParent } = pubEdge;
		const viewingFromParent =
			!viewingFromSibling && viewingFromTarget ? !pubIsParent : pubIsParent;
		const relationDefinition = relationTypeDefinitions[relationType];
		if (relationDefinition) {
			const { article, preposition, name } = relationDefinition;
			const relationName = <span className="relation-name">{name}</span>;
			const pubTitleNode = pubTitle && <span className="pub-title">{pubTitle}</span>;
			if (viewingFromSibling) {
				return (
					<>
						Another {relationName} of {pubTitleNode || 'this Pub'}
					</>
				);
			}
			if (viewingFromParent) {
				return (
					<>
						{toTitleCase(article)} {relationName} {preposition}{' '}
						{pubTitleNode || 'this Pub'}
					</>
				);
			}
			return (
				<>
					{pubTitleNode || 'This Pub'} is {article} {relationName} {preposition}
				</>
			);
		}
		return null;
	};

	return (
		<div
			className={classNames('pub-edge-listing-card-component', inPubBody && 'in-pub-body')}
			style={{ borderColor: accentColor || communityData.accentColorDark }}
		>
			{children && <div className="controls">{children}</div>}
			<div className={classNames('relation', showIcon && 'show-icon')}>
				{showIcon && (
					<Icon
						icon="key-enter"
						color={accentColor}
						iconSize={14}
						className="drop-return"
					/>
				)}
				{renderRelation()}
			</div>
			<PubEdge
				pubEdge={pubEdge}
				viewingFromTarget={viewingFromTarget}
				actsLikeLink={inPubBody}
			/>
		</div>
	);
};

PubEdgeListingCard.propTypes = propTypes;
PubEdgeListingCard.defaultProps = defaultProps;
export default PubEdgeListingCard;
