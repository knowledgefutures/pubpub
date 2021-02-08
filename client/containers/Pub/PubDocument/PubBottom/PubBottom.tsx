import React from 'react';

import { getNotes } from 'components/Editor/utils';
import { PubPageData } from 'utils/types';

import LicenseSection from './LicenseSection';
import SearchableNoteSection from './SearchableNoteSection';
import DiscussionsSection from './Discussions/DiscussionsSection';
import ReadNextSection from './ReadNextSection';

require('./pubBottom.scss');

type Props = {
	pubData: PubPageData;
	collabData: any;
	updateLocalData: (...args: any[]) => any;
	sideContentRef: any;
	mainContentRef: any;
	showDiscussions?: boolean;
};

const PubBottom = (props: Props) => {
	const {
		collabData: { editorChangeObject },
		pubData,
		showDiscussions = true,
		updateLocalData,
		sideContentRef,
		mainContentRef,
	} = props;

	const { citations = [], footnotes = [] } = editorChangeObject.view
		? getNotes(editorChangeObject.view.state.doc)
		: {};

	return (
		<div className="pub-bottom-component">
			<div className="inner">
				<ReadNextSection pubData={pubData} />
				{footnotes.length > 0 && (
					<SearchableNoteSection
						title="Footnotes"
						items={footnotes}
						searchPlaceholder="Search footnotes..."
					/>
				)}
				{citations.length > 0 && (
					<SearchableNoteSection
						title="Citations"
						items={citations}
						searchPlaceholder="Search citations..."
					/>
				)}
				<LicenseSection pubData={pubData} updateLocalData={updateLocalData} />
				{showDiscussions && (
					<DiscussionsSection
						pubData={pubData}
						updateLocalData={updateLocalData}
						sideContentRef={sideContentRef}
						mainContentRef={mainContentRef}
					/>
				)}
			</div>
		</div>
	);
};

export default PubBottom;
