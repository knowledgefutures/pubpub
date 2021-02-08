import React from 'react';

import { usePageContext } from 'utils/hooks';

import Notes, { NotePropType } from './Notes';
import PubBottomSection, { SectionBullets } from './PubBottomSection';

type Props = {
	items: NotePropType[];
} & React.ComponentProps<typeof PubBottomSection>;

const SearchableNoteSection = (props: Props) => {
	const { items, ...restProps } = props;
	const numberedItems = items.map((item, index) => ({ ...item, number: index + 1 }));
	const { communityData } = usePageContext();

	return (
		<PubBottomSection
			accentColor={communityData.accentColorDark}
			isSearchable={true}
			centerItems={<SectionBullets>{items.length}</SectionBullets>}
			{...restProps}
		>
			{({ searchTerm }) => (
				<Notes
					accentColor={communityData.accentColorDark}
					notes={numberedItems.filter(
						(fn) =>
							!searchTerm ||
							[fn.html, fn.unstructuredValue]
								.filter((x): x is string => !!x)
								.map((source) => source.toLowerCase())
								.some((source) => source.includes(searchTerm.toLowerCase())),
					)}
				/>
			)}
		</PubBottomSection>
	);
};

export default SearchableNoteSection;
