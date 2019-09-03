import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { PageContext } from 'components/PageWrapper/PageWrapper';
import { PubSuspendWhileTyping } from '../../PubSuspendWhileTyping';

import Footnotes, { footnotePropType } from './Footnotes';
import PubBottomSection, { SectionBullets } from './PubBottomSection';
import DiscussionsSection from './Discussions/DiscussionsSection';

require('./pubBottom.scss');

const propTypes = {
	pubData: PropTypes.shape({
		citations: PropTypes.arrayOf(footnotePropType).isRequired,
		footnotes: PropTypes.arrayOf(footnotePropType).isRequired,
	}).isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object,
	updateLocalData: PropTypes.func.isRequired,
	sideContentRef: PropTypes.object.isRequired,
	mainContentRef: PropTypes.object.isRequired,
	showDiscussions: PropTypes.bool,
};

const defaultProps = {
	firebaseBranchRef: undefined,
	showDiscussions: true,
};

const LicenseSection = () => {
	const { communityData } = useContext(PageContext);

	return (
		<PubBottomSection
			accentColor={communityData.accentColorDark}
			isExpandable={false}
			className="pub-bottom-license"
			title="License"
			centerItems={
				<SectionBullets>
					<a
						target="_blank"
						rel="license noopener noreferrer"
						href="https://creativecommons.org/licenses/by/4.0/"
					>
						Creative Commons Attribution 4.0 International (CC-BY 4.0)
					</a>
				</SectionBullets>
			}
		/>
	);
};

const SearchableFootnoteSection = (props) => {
	const { items, nodeType, viewNode, ...restProps } = props;
	const numberedItems = items.map((item, index) => ({ ...item, number: index + 1 }));
	const { communityData } = useContext(PageContext);

	const targetFootnoteElement = (fn) =>
		viewNode &&
		viewNode.querySelector(`*[data-node-type="${nodeType}"][data-count="${fn.number}"]`);

	return (
		<PubBottomSection
			accentColor={communityData.accentColorDark}
			isSearchable={true}
			centerItems={<SectionBullets>{items.length}</SectionBullets>}
			{...restProps}
		>
			{({ searchTerm }) => (
				<Footnotes
					accentColor={communityData.accentColorDark}
					targetFootnoteElement={targetFootnoteElement}
					footnotes={numberedItems.filter(
						(fn) =>
							!searchTerm ||
							[fn.html, fn.unstructuredValue]
								.filter((x) => x)
								.map((source) => source.toLowerCase())
								.some((source) => source.includes(searchTerm.toLowerCase())),
					)}
				/>
			)}
		</PubBottomSection>
	);
};

SearchableFootnoteSection.propTypes = {
	items: PropTypes.arrayOf(footnotePropType).isRequired,
	nodeType: PropTypes.string.isRequired,
	viewNode: PropTypes.object,
};

SearchableFootnoteSection.defaultProps = {
	viewNode: null,
};

const PubBottom = (props) => {
	const {
		collabData: { editorChangeObject },
		pubData: { citations = [], footnotes = [] },
		showDiscussions,
	} = props;

	return (
		<PubSuspendWhileTyping delay={1000}>
			{() => (
				<div className="pub-bottom-component">
					<div className="inner">
						{footnotes.length > 0 && (
							<SearchableFootnoteSection
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
							<SearchableFootnoteSection
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
						<LicenseSection />
						{showDiscussions && <DiscussionsSection {...props} />}
					</div>
				</div>
			)}
		</PubSuspendWhileTyping>
	);
};

PubBottom.propTypes = propTypes;
PubBottom.defaultProps = defaultProps;
export default PubBottom;
