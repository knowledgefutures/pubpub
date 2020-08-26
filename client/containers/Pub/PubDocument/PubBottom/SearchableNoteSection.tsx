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
		// @ts-expect-error ts-migrate(2746) FIXME: This JSX tag's 'children' prop expects a single ch... Remove this comment to see the full error message
		<PubBottomSection
			accentColor={communityData.accentColorDark}
			isSearchable={true}
			// @ts-expect-error ts-migrate(2322) FIXME: Property 'children' is missing in type 'Element' b... Remove this comment to see the full error message
			centerItems={<SectionBullets>{items.length}</SectionBullets>}
			{...restProps}
		>
			{/* @ts-expect-error ts-migrate(2578) FIXME: Unused '@ts-expect-error' directive. */}
			{/* @ts-expect-error ts-migrate(2322) FIXME: Type '({ searchTerm }: { searchTerm: any; }) => El... Remove this comment to see the full error message */}
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
