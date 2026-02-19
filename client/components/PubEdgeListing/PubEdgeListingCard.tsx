import React, { useCallback, useState } from 'react';

import { Icon } from '@blueprintjs/core';
import classNames from 'classnames';

import { PubEdge } from 'components';
import { pubShortUrl } from 'utils/canonicalUrls';
import { usePageContext } from 'utils/hooks';
import { isViewingEdgeFromTarget, relationTypeDefinitions } from 'utils/pubEdge';
import { toTitleCase } from 'utils/strings';

import './pubEdgeListingCard.scss';

export type PubEdgeListingCardProps = {
	accentColor?: string;
	children?: React.ReactNode;
	inPubBody?: boolean;
	isInboundEdge: boolean;
	parentPub?: {
		title?: string;
		slug: string;
	};
	pubEdgeDescriptionIsVisible: boolean;
	pubEdge: any;
	pubEdgeElement?: React.ReactNode;
	showIcon?: boolean;
	viewingFromSibling?: boolean;
};

type Props = PubEdgeListingCardProps;

const PubEdgeListingCard = (props: Props) => {
	const { communityData } = usePageContext();
	const {
		accentColor,
		children = [],
		inPubBody = false,
		isInboundEdge,
		pubEdge,
		pubEdgeElement = null,
		parentPub = null,
		showIcon,
		viewingFromSibling = false,
		pubEdgeDescriptionIsVisible = true,
	} = props;
	const viewingFromTarget = isViewingEdgeFromTarget(pubEdge, viewingFromSibling, isInboundEdge);
	const [hover, setHover] = useState(false);
	const handleMouseEnter = useCallback(() => setHover(true), []);
	const handleMouseLeave = useCallback(() => setHover(false), []);
	const hoverAccentColor = hover ? accentColor || communityData.accentColorDark : '#ddd';
	const style = { borderColor: hoverAccentColor ?? undefined };

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
		// biome-ignore lint/a11y: shhhhhh
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
					accentColor={hoverAccentColor ?? undefined}
					actsLikeLink={inPubBody}
					pubEdge={pubEdge}
					viewingFromTarget={viewingFromTarget}
					showDescriptionByDefault={pubEdgeDescriptionIsVisible}
				/>
			)}
		</div>
	);
};

export default PubEdgeListingCard;
