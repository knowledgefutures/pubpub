import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { GridWrapper } from 'components';
import { usePageContext } from '../pubHooks';

import PubDetails from './details';
import PubHeaderBackground from './PubHeaderBackground';
import PubHeaderMain from './PubHeaderMain';
import SmallHeaderButton from './SmallHeaderButton';

require('./pubHeader.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	historyData: PropTypes.object.isRequired,
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
	const { pubData, communityData, historyData, updateLocalData } = props;
	const [showingDetails, setShowingDetails] = useState(false);
	const [fixedHeight, setFixedHeight] = useState(null);

	const toggleDetails = () => {
		if (!showingDetails && headerRef.current) {
			const boundingRect = headerRef.current.getBoundingClientRect();
			setFixedHeight(boundingRect.height);
		}
		setShowingDetails(!showingDetails);
	};

	return (
		<PubHeaderBackground
			className={classNames('pub-header-component', showingDetails && 'showing-details')}
			pubData={pubData}
			communityData={communityData}
			ref={headerRef}
			style={fixedHeight && showingDetails ? { height: fixedHeight } : {}}
		>
			<GridWrapper containerClassName="pub" columnClassName="pub-header-column">
				{!showingDetails && (
					<PubHeaderMain
						pubData={pubData}
						communityData={communityData}
						updateLocalData={updateLocalData}
						historyData={historyData}
					/>
				)}
				{showingDetails && <PubDetails pubData={pubData} communityData={communityData} />}
				<ToggleDetailsButton showingDetails={showingDetails} onClick={toggleDetails} />
			</GridWrapper>
		</PubHeaderBackground>
	);
};

PubHeader.propTypes = propTypes;
export default PubHeader;
