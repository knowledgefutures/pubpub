import React from 'react';
import { Classes, Menu, MenuItem } from '@blueprintjs/core';

import { Icon } from 'components';

require('./sortList.scss');

type Props = {
	selected: string;
	onSelect: (...args: any[]) => any;
};

const SortList = (props: Props) => {
	const onSelect = props.onSelect;
	const options = [
		{ id: 0, slug: 'newestThread', title: 'Newest Thread' },
		{ id: 1, slug: 'oldestThread', title: 'Oldest Thread' },
		{ id: 2, slug: 'newestReply', title: 'Most Recent Reply' },
		{ id: 3, slug: 'oldestReply', title: 'Least Recent Reply' },
		{ id: 4, slug: 'mostReplies', title: 'Most Replies' },
		{ id: 5, slug: 'leastReplies', title: 'Least Replies' },
	];
	return (
		<Menu className={`sort-list-component ${Classes.ELEVATION_1}`}>
			<li className={Classes.MENU_HEADER}>
				<h6>Sort</h6>
			</li>

			{options.map((option) => {
				const handleClick = () => {
					onSelect(option.slug);
				};
				return (
					<MenuItem
						key={`option-${option.id}`}
						onClick={handleClick}
						labelElement={
							props.selected === option.slug ? <Icon icon="small-tick" /> : undefined
						}
						text={option.title}
					/>
				);
			})}
		</Menu>
	);
};
export default SortList;
