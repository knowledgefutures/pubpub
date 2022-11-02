import React from 'react';

import { PubPageData } from 'types';
import { usePubNotes } from '../../usePubNotes';

import LicenseSection from './LicenseSection';
import SearchableNoteSection from './SearchableNoteSection';
import DiscussionsSection from './Discussions/DiscussionsSection';
import ReadNextSection from './ReadNextSection';

require('./pubBottom.scss');

type Props = {
	pubData: PubPageData;
	updateLocalData: (...args: any[]) => any;
	sideContentRef: any;
	mainContentRef: any;
	showDiscussions?: boolean;
};

const PubBottom = (props: Props) => {
	const {
		pubData,
		showDiscussions = true,
		updateLocalData,
		sideContentRef,
		mainContentRef,
	} = props;

	const { footnotes, citations } = usePubNotes();

	return (
		<div className="pub-bottom-component">
			<div className="inner">
				{footnotes.length > 0 && (
					<SearchableNoteSection
						title="Footnotes"
						notes={footnotes}
						searchPlaceholder="Search footnotes..."
					/>
				)}
				{citations.length > 0 && (
					<SearchableNoteSection
						title="References"
						notes={citations}
						searchPlaceholder="Search references..."
					/>
				)}
				<LicenseSection />
				{showDiscussions && (
					<DiscussionsSection
						pubData={pubData}
						updateLocalData={updateLocalData}
						sideContentRef={sideContentRef}
						mainContentRef={mainContentRef}
					/>
				)}
				<ReadNextSection pubData={pubData} />
			</div>
		</div>
	);
};

export default PubBottom;
