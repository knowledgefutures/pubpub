import * as React from 'react';
import { Button, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import fuzzysearch from 'fuzzysearch';

type OwnProps = {
	collection: {
		page?: {
			title?: string;
		};
	};
	communityData: {
		pages?: {
			title?: string;
			id?: string;
		}[];
	};
	onSelectPage: (...args: any[]) => any;
	targetElement?: React.ReactNode;
	minimal?: boolean;
	selfContained?: boolean;
};

const defaultProps = {
	minimal: false,
	targetElement: null,
	selfContained: false,
};

type Props = OwnProps & typeof defaultProps;

const LinkedPageSelect = (props: Props) => {
	const {
		communityData,
		collection,
		onSelectPage,
		minimal,
		targetElement,
		selfContained,
	} = props;

	const renderButtonText = () => {
		if (collection.page) {
			if (selfContained) {
				return (
					<>
						<em>Page:</em> {collection.page.title}
					</>
				);
			}
			return collection.page.title;
		}
		if (selfContained) {
			return 'Link to Page';
		}
		return <em>Link to Page</em>;
	};

	return (
		<Select
			// @ts-expect-error ts-migrate(2769) FIXME: Type 'undefined' is not assignable to type '{ titl... Remove this comment to see the full error message
			items={[{ title: '(None)', id: null }].concat(communityData.pages)}
			itemRenderer={(page, { handleClick }) => {
				return <MenuItem key={page.title} onClick={handleClick} text={page.title} />;
			}}
			itemListPredicate={(query, pages) => {
				return pages.filter((page) => {
					return fuzzysearch(query.toLowerCase(), page.title.toLowerCase());
				});
			}}
			onItemSelect={(page) => onSelectPage(page.id === null ? null : page)}
			popoverProps={{ popoverClassName: 'bp3-minimal' }}
		>
			{targetElement || (
				<Button
					className="linked-page-select-button"
					minimal={minimal}
					text={renderButtonText()}
					icon="link"
				/>
			)}
		</Select>
	);
};
LinkedPageSelect.defaultProps = defaultProps;
export default LinkedPageSelect;
