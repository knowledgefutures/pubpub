import React, { useRef, useState } from 'react';
import classNames from 'classnames';

import { GridWrapper, PubHeaderBackground } from 'components';
import { usePageContext } from 'utils/hooks';
import { useSticky } from 'client/utils/useSticky';
import { useViewport } from 'client/utils/useViewport';

import { usePubContext } from '../pubHooks';
import { mobileViewportCutoff } from './constants';
import PubDetails from './details';
import PubHeaderContent from './PubHeaderContent';
import SmallHeaderButton from './SmallHeaderButton';
import PubHeaderSticky from './PubHeaderSticky';

require('./pubHeader.scss');

type Props = {
	sticky?: boolean;
};

type ToggleDetailsProps = {
	showingDetails: boolean;
	onClick: () => void;
};

const ToggleDetailsButton = (props: ToggleDetailsProps) => {
	const label = props.showingDetails ? 'Hide details' : 'Show details';
	const icon = props.showingDetails ? 'cross' : 'expand-all';
	return (
		<SmallHeaderButton
			className={classNames('details-button', props.showingDetails && 'showing-details')}
			label={label}
			labelPosition="left"
			icon={icon}
			onClick={props.onClick}
		/>
	);
};

const PubHeader = (props: Props) => {
	const headerRef = useRef<HTMLDivElement>(null);
	const { pubData, updateLocalData } = usePubContext();
	const { sticky = true } = props;
	const { communityData } = usePageContext();
	const [showingDetails, setShowingDetails] = useState(false);
	const [fixedHeight, setFixedHeight] = useState<number | null>(null);
	const { viewportWidth } = useViewport();

	const isMobile = viewportWidth && viewportWidth <= mobileViewportCutoff;

	useSticky({
		isActive: sticky && !!headerRef.current,
		target: '.pub-header-component',
		offset: headerRef?.current?.offsetHeight ? 37 - headerRef.current.offsetHeight : 0,
	});

	const toggleDetails = () => {
		if (!showingDetails && headerRef.current) {
			if (isMobile) {
				// Fill the viewport with details
				// +1px to take care of that pesky bottom border
				window.scrollTo(0, 0);
				const boundingRect = headerRef.current.getBoundingClientRect();
				setFixedHeight(1 + window.innerHeight - boundingRect.top);
				setShowingDetails(true);
			} else {
				// Fix the height of the details to that of the main header content
				const boundingRect = headerRef.current.getBoundingClientRect();
				setFixedHeight(boundingRect.height);
			}
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
			safetyLayer={showingDetails ? 'full-height' : 'enabled'}
		>
			{/* Hackity hack: don't let the body scroll while the details are scrolling */}
			{isMobile && showingDetails && <style>{`body { overflow: hidden }`}</style>}
			<GridWrapper containerClassName="pub" columnClassName="pub-header-column">
				{!showingDetails && (
					<PubHeaderContent
						pubData={pubData}
						updateLocalData={updateLocalData}
						onShowHeaderDetails={toggleDetails}
					/>
				)}
				{showingDetails && (
					<PubDetails
						pubData={pubData}
						communityData={communityData}
						onCloseHeaderDetails={toggleDetails}
					/>
				)}
				<ToggleDetailsButton showingDetails={showingDetails} onClick={toggleDetails} />
			</GridWrapper>
			{sticky && <PubHeaderSticky />}
		</PubHeaderBackground>
	);
};

export default PubHeader;
