import React from 'react';

import { usePageContext } from 'utils/hooks';

import Notes, { notePropType } from './Notes';
import PubBottomSection, { SectionBullets } from './PubBottomSection';

type OwnProps = {
	items: notePropType[];
	nodeType: string;
	viewNode?: any;
};

const defaultProps = {
	viewNode: null,
};

type Props = OwnProps & typeof defaultProps;

const SearchableNoteSection = (props: Props) => {
	const { items, nodeType, viewNode, ...restProps } = props;
	const numberedItems = items.map((item, index) => ({ ...item, number: index + 1 }));
	const { communityData } = usePageContext();

	return (
		<PubBottomSection
			accentColor={communityData.accentColorDark}
			isSearchable={true}
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never[] ... Remove this comment to see the full error message
			centerItems={<SectionBullets>{items.length}</SectionBullets>}
			{...restProps}
		>
			{({ searchTerm }) => (
				<Notes
					accentColor={communityData.accentColorDark}
					notes={numberedItems.filter(
						(fn) =>
							!searchTerm ||
							// @ts-expect-error ts-migrate(2339) FIXME: Property 'html' does not exist on type '{ number: ... Remove this comment to see the full error message
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
SearchableNoteSection.defaultProps = defaultProps;
export default SearchableNoteSection;
