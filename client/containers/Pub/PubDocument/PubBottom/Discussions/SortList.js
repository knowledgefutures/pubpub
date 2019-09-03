import React from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItem } from '@blueprintjs/core';
import { Icon } from 'components';

require('./sortList.scss');

const propTypes = {
	selected: PropTypes.string.isRequired,
	onSelect: PropTypes.func.isRequired,
};

const SortList = (props) => {
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
		<Menu className="sort-list-component bp3-elevation-1">
			<li className="bp3-menu-header">
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

SortList.propTypes = propTypes;
export default SortList;
