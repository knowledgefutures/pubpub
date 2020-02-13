import React from 'react';
import PropTypes from 'prop-types';

import { GridWrapper } from 'components';

import { generateHeaderBreadcrumbs } from './headerUtils';
import PubHeaderBackground from './PubHeaderBackground';

require('./pubHeaderCompact.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	pubData: PropTypes.shape({
		slug: PropTypes.string,
		title: PropTypes.string,
	}).isRequired,
};
const defaultProps = {};

const PubHeaderCompact = (props) => {
	const { pubData, locationData, communityData } = props;
	return (
		<PubHeaderBackground
			pubData={pubData}
			communityData={communityData}
			className="pub-header-compact-component"
			showSafetyLayer={true}
		>
			<GridWrapper columnClassName="pub inner">
				<a href={`/pub/${pubData.slug}`}>{pubData.title}</a>
				{generateHeaderBreadcrumbs(pubData, locationData)}
			</GridWrapper>
		</PubHeaderBackground>
	);
};

PubHeaderCompact.propTypes = propTypes;
PubHeaderCompact.defaultProps = defaultProps;
export default PubHeaderCompact;
