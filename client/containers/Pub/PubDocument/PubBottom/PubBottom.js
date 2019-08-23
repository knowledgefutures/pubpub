import React from 'react';
import PropTypes from 'prop-types';
import fuzzysearch from 'fuzzysearch';

import Footnotes, { footnotePropType } from './Footnotes';
import PubBottomSection, { SectionBullets } from './PubBottomSection';

require('./pubBottom.scss');

const propTypes = {
	pubData: PropTypes.shape({
		citations: PropTypes.arrayOf(footnotePropType).isRequired,
		footnotes: PropTypes.arrayOf(footnotePropType).isRequired,
	}).isRequired,
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
		pubData: { citations, footnotes },
	} = props;
	return (
		<div className="pub-bottom-component">
			<div className="inner">
				<SearchableFootnoteSection title="Footnotes" items={footnotes} />
				<SearchableFootnoteSection title="Citations" items={citations} />
			</div>
		</div>
	);
};

PubBottom.propTypes = propTypes;
export default PubBottom;
