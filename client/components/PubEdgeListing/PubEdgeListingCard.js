import { Icon } from '@blueprintjs/core';
import classNames from 'classnames';
import React, { useState, useCallback } from 'react';
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
	isInboundEdge: PropTypes.bool.isRequired,
	pubEdge: pubEdgeType.isRequired,
	pubEdgeElement: PropTypes.node,
	pubTitle: PropTypes.string,
	showIcon: PropTypes.bool,
	viewingFromSibling: PropTypes.bool,
};

const defaultProps = {
	accentColor: null,
	children: [],
	inPubBody: false,
	pubEdgeElement: null,
	pubTitle: null,
	showIcon: false,
	viewingFromSibling: false,
};

const getIsViewingFromTarget = (pubEdge, viewingFromSibling, isInboundEdge) => {
	const { pubIsParent } = pubEdge;
	if (viewingFromSibling) {
		// If the `pub` in the edge relationship is the parent, then the `targetPub` is the child.
		// We want this edge to display the child -- in other words, we want to view from the
		// `targetPub` towards the `pub` only if the `pub` is the child.
		return !pubIsParent;
	}
	// If this edge is inbound, that means another Pub (relative to our vantage point) created it,
	// which is to say that we're viewing it from the target.
	return isInboundEdge;
};

const PubEdgeListingCard = (props) => {
	const {
		accentColor,
		children,
		inPubBody,
		isInboundEdge,
		pubEdge,
		pubEdgeElement,
		pubTitle,
		showIcon,
		viewingFromSibling,
	} = props;
	const { communityData } = usePageContext();
	const viewingFromTarget = getIsViewingFromTarget(pubEdge, viewingFromSibling, isInboundEdge);
	const [hover, setHover] = useState(false);
	const handleMouseEnter = useCallback(() => setHover(true), []);
	const handleMouseLeave = useCallback(() => setHover(false), []);
	const style = hover ? { borderColor: accentColor || communityData.accentColorDark } : {};

	const renderRelation = () => {
		const { relationType, pubIsParent } = pubEdge;
		const viewingFromParent =
			!viewingFromSibling && viewingFromTarget ? !pubIsParent : pubIsParent;
		const relationDefinition = relationTypeDefinitions[relationType];
		if (relationDefinition) {
			const { article, preposition, name } = relationDefinition;
			const relationName = <span className="relation-name">{name}</span>;
			if (viewingFromSibling) {
				const titlePart = pubTitle && (
					<>
						{preposition} <span className="pub-title">{pubTitle}</span>
					</>
				);
				return (
					<>
						Another {relationName} {titlePart}
					</>
				);
			}
			const pubTitleNode = pubTitle && <span className="pub-title">{pubTitle}</span>;
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
			style={style}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onFocus={handleMouseEnter}
			onBlur={handleMouseLeave}
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
			{pubEdgeElement || (
				<PubEdge
					pubEdge={pubEdge}
					viewingFromTarget={viewingFromTarget}
					actsLikeLink={inPubBody}
				/>
			)}
		</div>
	);
};

PubEdgeListingCard.propTypes = propTypes;
PubEdgeListingCard.defaultProps = defaultProps;
export default PubEdgeListingCard;
