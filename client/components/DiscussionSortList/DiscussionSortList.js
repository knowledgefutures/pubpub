import React from 'react';
import PropTypes from 'prop-types';

require('./discussionSortList.scss');

const propTypes = {
	selected: PropTypes.string.isRequired,
	onSelect: PropTypes.func.isRequired,
};

const DiscussionSortList = (props)=> {
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
		<div className="discussion-authors-list-component bp3-menu bp3-elevation-1">
			<li className="bp3-menu-header"><h6>Filter by Author</h6></li>

			{options.map((option)=> {
				const handleClick = ()=> { onSelect(option.slug); };
				return (
					<li>
						<div role="button" tabIndex={-1} key={`option-${option.id}`} className="bp3-menu-item" onClick={handleClick}>
							<div className="color">
								{props.selected === option.slug &&
									<span className="bp3-icon-standard bp3-icon-small-tick" />
								}
							</div>
							<div className="title">{option.title}</div>
						</div>
					</li>
				);
			})}
		</div>
	);
};

DiscussionSortList.propTypes = propTypes;
export default DiscussionSortList;
