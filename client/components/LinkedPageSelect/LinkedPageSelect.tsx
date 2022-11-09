import * as React from 'react';
import { Button, Classes, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import fuzzysearch from 'fuzzysearch';

import { Page } from 'types';

type Props = {
	selectedPageId: null | string;
	pages: Page[];
	onSelectPage: (page: Page) => unknown;
	disabled?: boolean;
};

const LinkedPageSelect = (props: Props) => {
	const { pages, onSelectPage, selectedPageId, disabled } = props;
	const selectedPage = pages.find((page) => page.id === selectedPageId);

	const renderButtonText = () => {
		if (selectedPage) {
			return selectedPage.title;
		}
		return <em>Choose a Page</em>;
	};

	return (
		<Select
			items={pages}
			itemRenderer={(page, { handleClick }) => {
				return <MenuItem key={page.title} onClick={handleClick} text={page.title} />;
			}}
			itemListPredicate={(query, predPages) => {
				return predPages.filter((page) => {
					return fuzzysearch(query.toLowerCase(), page.title.toLowerCase());
				});
			}}
			onItemSelect={onSelectPage}
			popoverProps={{ popoverClassName: Classes.MINIMAL }}
		>
			<Button
				className="linked-page-select-button"
				text={renderButtonText()}
				rightIcon="chevron-down"
				disabled={disabled}
				minimal
				outlined
			/>
		</Select>
	);
};
export default LinkedPageSelect;
