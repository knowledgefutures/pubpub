import React from 'react';
import { Switch } from '@blueprintjs/core';
// @ts-expect-error ts-migrate(2614) FIXME: Module '"./LabelFilter"' has no exported member 'p... Remove this comment to see the full error message
import LabelFilter, { propTypes as labelFilterPropTypes } from './LabelFilter';

require('./filterMenu.scss');

/*
(ts-migrate) TODO: Migrate the remaining prop types
...labelFilterPropTypes
*/
type Props = {
	isBrowsingArchive: boolean;
	isShowingAnchoredComments: boolean;
	onBrowseArchive: (...args: any[]) => any;
	onShowAnchoredComments: (...args: any[]) => any;
};

const FilterMenu = (props: Props) => {
	const {
		isBrowsingArchive,
		isShowingAnchoredComments,
		onBrowseArchive,
		onShowAnchoredComments,
	} = props;
	return (
		<div className="filter-menu-component">
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
			{/* @ts-expect-error ts-migrate(2740) FIXME: Type '{ isBrowsingArchive: boolean; isShowingAncho... Remove this comment to see the full error message */}
			<LabelFilter {...props} />
		</div>
	);
};
export default FilterMenu;
