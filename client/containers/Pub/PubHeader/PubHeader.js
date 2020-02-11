import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import stickybits from 'stickybits';

import { GridWrapper } from 'components';

import PubDetails from './details';
import PubHeaderBackground from './PubHeaderBackground';
import PubHeaderMain from './PubHeaderMain';
import SmallHeaderButton from './SmallHeaderButton';
import PubHeaderSticky from './PubHeaderSticky';

require('./pubHeader.scss');

const stickyHeight = 37;

const propTypes = {
	collabData: PropTypes.object.isRequired,
	communityData: PropTypes.object.isRequired,
	historyData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
	sticky: PropTypes.bool,
};

const defaultProps = {
	sticky: true,
};

const useSticky = (headerElement) => {
	useEffect(() => {
		if (!headerElement) {
			return () => {};
		}

		const nextOffsetHeight = headerElement.offsetHeight;
		const stickyInstance = stickybits('.pub-header-component', {
			stickyBitStickyOffset: stickyHeight - nextOffsetHeight,
			useStickyClasses: true,
		});

		return () => {
			stickyInstance.cleanup();
		};
	}, [headerElement]);
};

// eslint-disable-next-line react/prop-types
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
	const { collabData, communityData, historyData, pubData, updateLocalData, sticky } = props;
	const [showingDetails, setShowingDetails] = useState(false);
	const [fixedHeight, setFixedHeight] = useState(null);

	useSticky(sticky && headerRef.current);

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
			showTopBar={true}
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
			<PubHeaderSticky pubData={pubData} collabData={collabData} />
		</PubHeaderBackground>
	);
};

PubHeader.propTypes = propTypes;
PubHeader.defaultProps = defaultProps;
export default PubHeader;
