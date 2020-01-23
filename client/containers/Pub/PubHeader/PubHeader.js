import React, { useRef } from 'react';
import PropTypes from 'prop-types';

import { GridWrapper } from 'components';
import { usePageContext } from '../pubHooks';

import PubHeaderBackground from './PubHeaderBackground';
import PubHeaderMain from './PubHeaderMain';

require('./pubHeader.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const PubHeader = (props) => {
	const headerRef = useRef(null);
	const { pubData, communityData, updateLocalData } = props;
	return (
		<PubHeaderBackground
			className="pub-header-component"
			pubData={pubData}
			communityData={communityData}
			ref={headerRef}
		>
			<GridWrapper containerClassName="pub" columnClassName="pub-header-column">
				<PubHeaderMain
					pubData={pubData}
					communityData={communityData}
					updateLocalData={updateLocalData}
				/>
			</GridWrapper>
		</PubHeaderBackground>
	);
};

PubHeader.propTypes = propTypes;
export default PubHeader;
