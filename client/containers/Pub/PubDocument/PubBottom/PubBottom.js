import React from 'react';
import PropTypes from 'prop-types';
import fuzzysearch from 'fuzzysearch';

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

const SearchableFootnoteSection = (props) => {
	const { items, ...restProps } = props;
	return (
		<PubBottomSection
			isSearchable={true}
			centerItems={<SectionBullets>{items.length}</SectionBullets>}
			{...restProps}
		>
			{({ searchTerm }) => (
				<Footnotes
					footnotes={items.filter(
						(fn) =>
							!searchTerm ||
							fuzzysearch(searchTerm.toLowerCase(), fn.content.toLowerCase()),
					)}
				/>
			)}
		</PubBottomSection>
	);
};

SearchableFootnoteSection.propTypes = {
	items: PropTypes.arrayOf(footnotePropType).isRequired,
};

const PubBottom = (props) => {
	const {
		pubData: { citations = [], footnotes = [] },
		showDiscussions,
	} = props;
	return (
		<PubSuspendWhileTyping delay={1000}>
			{() => (
				<div className="pub-bottom-component">
					<div className="inner">
						{footnotes.length > 0 && (
							<SearchableFootnoteSection title="Footnotes" items={footnotes} />
						)}
						{citations.length > 0 && (
							<SearchableFootnoteSection title="Citations" items={citations} />
						)}
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
