import React from 'react';

import { getNotes } from 'components/Editor/utils';

import LicenseSection from './LicenseSection';
import SearchableNoteSection from './SearchableNoteSection';
import DiscussionsSection from './Discussions/DiscussionsSection';
import ReadNextSection from './ReadNextSection';

require('./pubBottom.scss');

type OwnProps = {
	pubData: any;
	collabData: any;
	updateLocalData: (...args: any[]) => any;
	sideContentRef: any;
	mainContentRef: any;
	showDiscussions?: boolean;
};

const defaultProps = {
	showDiscussions: true,
};

type Props = OwnProps & typeof defaultProps;

const PubBottom = (props: Props) => {
	const {
		collabData: { editorChangeObject },
		pubData,
		showDiscussions,
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
						// @ts-expect-error ts-migrate(2322) FIXME: Type '{ title: string; items: never[]; nodeType: s... Remove this comment to see the full error message
						title="Footnotes"
						items={footnotes}
						nodeType="footnote"
						searchPlaceholder="Search footnotes..."
						viewNode={
							editorChangeObject &&
							editorChangeObject.view &&
							editorChangeObject.view.dom
						}
					/>
				)}
				{citations.length > 0 && (
					<SearchableNoteSection
						// @ts-expect-error ts-migrate(2322) FIXME: Type '{ title: string; items: never[]; nodeType: s... Remove this comment to see the full error message
						title="Citations"
						items={citations}
						nodeType="citation"
						searchPlaceholder="Search citations..."
						viewNode={
							editorChangeObject &&
							editorChangeObject.view &&
							editorChangeObject.view.dom
						}
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
PubBottom.defaultProps = defaultProps;
export default PubBottom;
