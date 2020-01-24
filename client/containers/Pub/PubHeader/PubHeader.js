import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { GridWrapper } from 'components';
import { usePageContext } from '../pubHooks';

import PubHeaderBackground from './PubHeaderBackground';
import PubHeaderMain from './PubHeaderMain';
import SmallHeaderButton from './SmallHeaderButton';

require('./pubHeader.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const ToggleDetailsButton = ({ showingDetails, onClick }) => {
	const label = showingDetails ? 'Hide details' : 'Show details';
	const icon = showingDetails ? 'cross' : 'expand-all';
	return (
		<SmallHeaderButton
			className={classNames('details-button', showingDetails && 'showing-details')}
			label={label}
			labelPosition="left"
			icon={icon}
			onClick={onClick}
		/>
	);
};

const PubHeader = (props) => {
	const headerRef = useRef(null);
	const { pubData, communityData, updateLocalData } = props;
	const [showingDetails, setShowingDetails] = useState(false);
	return (
		<PubHeaderBackground
			className="pub-header-component"
			pubData={pubData}
			communityData={communityData}
			ref={headerRef}
		>
			<GridWrapper containerClassName="pub" columnClassName="pub-header-column">
				<ToggleDetailsButton
					showingDetails={showingDetails}
					onClick={() => setShowingDetails(!showingDetails)}
				/>
				{!showingDetails && (
					<PubHeaderMain
						pubData={pubData}
						communityData={communityData}
						updateLocalData={updateLocalData}
					/>
				)}
			</GridWrapper>
		</PubHeaderBackground>
	);
};

PubHeader.propTypes = propTypes;
export default PubHeader;
