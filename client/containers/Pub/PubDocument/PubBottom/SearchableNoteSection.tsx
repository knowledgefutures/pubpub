import React from 'react';

import { usePageContext } from 'utils/hooks';
import { RenderedNote } from 'utils/notes';

import Notes from './Notes';
import PubBottomSection, { SectionBullets } from './PubBottomSection';

type Props = {
	notes: RenderedNote[];
} & React.ComponentProps<typeof PubBottomSection>;

const checkContains = (searchTerm) => (note) =>
	!searchTerm ||
	[note.renderedStructuredValue?.html, note.unstructuredValue]
		.filter((source): source is string => !!source)
		.map((source) => source.toLowerCase())
		.some((source) => source.includes(searchTerm.toLowerCase()));

const SearchableNoteSection = (props: Props) => {
	const { notes, ...restProps } = props;
	const { communityData } = usePageContext();

	return (
		<PubBottomSection
			accentColor={communityData.accentColorDark}
			isSearchable={true}
			centerItems={<SectionBullets>{notes.length}</SectionBullets>}
			{...restProps}
		>
			{({ searchTerm }) => (
				<Notes
					accentColor={communityData.accentColorDark}
					notes={notes.filter(checkContains(searchTerm))}
				/>
			)}
		</PubBottomSection>
	);
};

export default SearchableNoteSection;
