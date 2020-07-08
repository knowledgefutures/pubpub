import { Icon } from '@blueprintjs/core';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

import { relationTypeDefinitions } from 'utils/pubEdge/relations';
import { PubEdge } from 'components';

import { pubEdgeType } from '../PubEdge/constants';

require('./pubEdgeListingCard.scss');

const propTypes = {
	accentColor: PropTypes.string.isRequired,
	children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
	pubEdge: pubEdgeType.isRequired,
	showIcon: PropTypes.bool,
};

const defaultProps = {
	children: [],
	showIcon: false,
};

const PubEdgeListingCard = (props) => {
	const { accentColor, children, pubEdge, showIcon } = props;
	const {
		pubIsParent,
		relationType,
		externalPublication: { url },
	} = pubEdge;
	const handleClick = useCallback(
		(e) => {
			if (e.type === 'click' || e.key === 'Enter') {
				window.open(url, '_top');
			}
		},
		[url],
	);
	const relationTypeDefinition = relationTypeDefinitions[relationType];
	const relationString = pubIsParent
		? relationTypeDefinition.childRelationString
		: relationTypeDefinition.parentRelationString;

	return (
		<div
			className="pub-edge-listing-card-component"
			style={{ borderColor: accentColor }}
			onClick={handleClick}
			onKeyDown={handleClick}
			role="link"
			tabIndex="0"
		>
			{children}
			<div className={classNames('relationship', showIcon && 'show-icon')}>
				{showIcon && (
					<Icon
						icon="key-enter"
						color={accentColor}
						iconSize={14}
						className="drop-return"
					/>
				)}
				This Pub {relationString}
			</div>
			<PubEdge pubEdge={pubEdge} />
		</div>
	);
};

PubEdgeListingCard.propTypes = propTypes;
PubEdgeListingCard.defaultProps = defaultProps;
export default PubEdgeListingCard;
