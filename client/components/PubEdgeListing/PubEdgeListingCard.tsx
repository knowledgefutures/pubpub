import { Icon } from '@blueprintjs/core';
import classNames from 'classnames';
import React, { useState, useCallback } from 'react';

import { PubEdge } from 'components';
import { toTitleCase } from 'utils/strings';
import { usePageContext } from 'utils/hooks';
import { relationTypeDefinitions } from 'utils/pubEdge';
import { pubShortUrl } from 'utils/canonicalUrls';

import { pubEdgeType } from '../PubEdge/constants';

require('./pubEdgeListingCard.scss');

type OwnProps = {
	accentColor?: string;
	children?: React.ReactNode;
	inPubBody?: boolean;
	isInboundEdge: boolean;
	parentPub?: {
		title?: string;
	};
	pubEdge: pubEdgeType;
	pubEdgeElement?: React.ReactNode;
	showIcon?: boolean;
	viewingFromSibling?: boolean;
};

const defaultProps = {
	accentColor: null,
	children: [],
	inPubBody: false,
	parentPub: null,
	pubEdgeElement: null,
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

type Props = OwnProps & typeof defaultProps;

const PubEdgeListingCard = (props: Props) => {
	const { communityData } = usePageContext();
	const {
		accentColor,
		children,
		inPubBody,
		isInboundEdge,
		pubEdge,
		pubEdgeElement,
		parentPub,
		showIcon,
		viewingFromSibling,
	} = props;
	const viewingFromTarget = getIsViewingFromTarget(pubEdge, viewingFromSibling, isInboundEdge);
	const [hover, setHover] = useState(false);
	const handleMouseEnter = useCallback(() => setHover(true), []);
	const handleMouseLeave = useCallback(() => setHover(false), []);
	const hoverAccentColor = hover ? accentColor || communityData.accentColorDark : '#ddd';
	const style = { borderColor: hoverAccentColor };

	const renderRelation = () => {
		const { relationType, pubIsParent } = pubEdge;
		const viewingFromParent =
			!viewingFromSibling && viewingFromTarget ? !pubIsParent : pubIsParent;
		const relationDefinition = relationTypeDefinitions[relationType];

		if (relationDefinition) {
			const { article, preposition, name } = relationDefinition;
			const relationName = <span className="relation-name">{name}</span>;

			if (viewingFromSibling) {
				const titlePart = parentPub && (
					<>
						{preposition}{' '}
						<a className="pub-title" href={pubShortUrl(parentPub)}>
							{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'title' does not exist on type 'never'. */}
							{parentPub.title}
						</a>
					</>
				);
				return (
					<>
						Another {relationName} {titlePart}
					</>
				);
			}

			// @ts-expect-error ts-migrate(2339) FIXME: Property 'title' does not exist on type 'never'.
			const pubTitleNode = parentPub && <span className="pub-title">{parentPub.title}</span>;

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
						// @ts-expect-error ts-migrate(2322) FIXME: Property 'alt' does not exist on type 'IntrinsicAt... Remove this comment to see the full error message
						alt=""
					/>
				)}
				{renderRelation()}
			</div>
			{pubEdgeElement || (
				<PubEdge
					accentColor={hoverAccentColor}
					actsLikeLink={inPubBody}
					pubEdge={pubEdge}
					viewingFromTarget={viewingFromTarget}
				/>
			)}
		</div>
	);
};
PubEdgeListingCard.defaultProps = defaultProps;
export default PubEdgeListingCard;
