import React, { useRef, useState } from 'react';
import classNames from 'classnames';
import { getJSON } from 'components/Editor';

import { GridWrapper, PubHeaderBackground } from 'components';
import { usePageContext } from 'utils/hooks';
import { useSticky } from 'client/utils/useSticky';
import { useViewport } from 'client/utils/useViewport';

import { PubPageData } from 'types';
import { getTocHeadings } from './headerUtils';
import { mobileViewportCutoff } from './constants';
import PubDetails from './details';
import PubHeaderContent from './PubHeaderContent';
import SmallHeaderButton from './SmallHeaderButton';
import PubHeaderSticky from './PubHeaderSticky';

const getPubHeadings = (pubData, collabData) => {
	let docJson = pubData.initialDoc;
	if (collabData.editorChangeObject && collabData.editorChangeObject.view) {
		docJson = getJSON(collabData.editorChangeObject.view);
	}
	return docJson ? getTocHeadings(docJson) : [];
};

require('./pubHeader.scss');

type Props = {
	collabData: any;
	historyData: any;
	pubData: PubPageData;
	updateLocalData: (...args: any[]) => any;
	sticky?: boolean;
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

const PubHeader = (props: Props) => {
	const headerRef = useRef(null);
	const { collabData, historyData, pubData, updateLocalData, sticky = true } = props;
	const { communityData } = usePageContext();
	const [showingDetails, setShowingDetails] = useState(false);
	const [fixedHeight, setFixedHeight] = useState(null);
	const { viewportWidth } = useViewport();

	const pubHeadings = getPubHeadings(pubData, collabData);
	// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
	const isMobile = viewportWidth <= mobileViewportCutoff;

	useSticky({
		// @ts-expect-error ts-migrate(2322) FIXME: Type 'false | null' is not assignable to type 'boo... Remove this comment to see the full error message
		isActive: sticky && headerRef.current,
		target: '.pub-header-component',
		// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
		offset: headerRef.current ? 37 - headerRef.current.offsetHeight : 0,
	});

	const toggleDetails = () => {
		if (!showingDetails && headerRef.current) {
			if (isMobile) {
				// Fill the viewport with details
				// +1px to take care of that pesky bottom border
				window.scrollTo(0, 0);
				// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
				const boundingRect = headerRef.current.getBoundingClientRect();
				// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'number' is not assignable to par... Remove this comment to see the full error message
				setFixedHeight(1 + window.innerHeight - boundingRect.top);
				setShowingDetails(true);
			} else {
				// Fix the height of the details to that of the main header content
				// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
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
						historyData={historyData}
						pubHeadings={pubHeadings}
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
			{/* @ts-expect-error ts-migrate(2322) FIXME: Type '{ pubData: any; collabData: any; pubHeadings... Remove this comment to see the full error message */}
			<PubHeaderSticky pubData={pubData} collabData={collabData} pubHeadings={pubHeadings} />
		</PubHeaderBackground>
	);
};

export default PubHeader;
