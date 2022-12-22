import React from 'react';
import { Card, Classes, Switch } from '@blueprintjs/core';

import LabelFilter from './LabelFilter';

require('./filterMenu.scss');

type Props = {
	isBrowsingArchive: boolean;
	isShowingAnchoredComments: boolean;
	onBrowseArchive: (...args: any[]) => any;
	onShowAnchoredComments: (...args: any[]) => any;
	[key: string]: any;
};

const FilterMenu = (props: Props) => {
	const {
		isBrowsingArchive,
		isShowingAnchoredComments,
		onBrowseArchive,
		onShowAnchoredComments,
	} = props;
	return (
		<Card className={`filter-menu-component ${Classes.ELEVATION_1}`}>
			<Switch
				label="Browse archived comments"
				checked={isBrowsingArchive}
				// @ts-expect-error ts-migrate(2339) FIXME: Property 'checked' does not exist on type 'EventTa... Remove this comment to see the full error message
				onChange={(e) => onBrowseArchive(e.target.checked)}
			/>
			<Switch
				label="Show anchored comments"
				checked={isShowingAnchoredComments}
				// @ts-expect-error ts-migrate(2339) FIXME: Property 'checked' does not exist on type 'EventTa... Remove this comment to see the full error message
				onChange={(e) => onShowAnchoredComments(e.target.checked)}
			/>
			<LabelFilter {...(props as any)} />
		</Card>
	);
};
export default FilterMenu;
