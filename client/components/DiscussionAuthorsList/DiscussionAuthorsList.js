import React from 'react';
import PropTypes from 'prop-types';
import Avatar from 'components/Avatar/Avatar';

require('./discussionAuthorsList.scss');

const propTypes = {
	threadsData: PropTypes.array,
	selected: PropTypes.array.isRequired,
	onSelect: PropTypes.func.isRequired,
};

const defaultProps = {
	threadsData: [],
};

const DiscussionAuthorsList = (props)=> {
	const authorsObject = {};
	const onSelect = props.onSelect;
	props.threadsData.forEach((thread)=> {
		thread.forEach((discussion)=> {
			authorsObject[discussion.author.id] = discussion.author;
		});
	});
	const authors = Object.values(authorsObject).sort((foo, bar)=> {
		if (foo.fullName < bar.fullName) { return -1; }
		if (foo.fullName > bar.fullName) { return 1; }
		return 0;
	});
	return (
		<div className="discussion-authors-list-component pt-menu pt-elevation-1">
			<li className="pt-menu-header"><h6>Filter by Discussion Author</h6></li>

			{authors.map((author)=> {
				const handleClick = ()=> { onSelect(author.id); };
				return (
					<li>
						<div role="button" tabIndex={-1} key={`author-${author.id}`} className="pt-menu-item" onClick={handleClick}>
							<div className="color">
								{props.selected.indexOf(author.id) > -1 &&
									<span className="pt-icon-standard pt-icon-small-tick" />
								}
							</div>
							<Avatar width={16} userInitials={author.initials} userAvatar={author.avatar} />
							<div className="title">{author.fullName}</div>
						</div>
					</li>
				);
			})}
			{!authors.length &&
				<div className="pt-menu-item empty">No Authors to Filter by</div>
			}
		</div>
	);
};

DiscussionAuthorsList.propTypes = propTypes;
DiscussionAuthorsList.defaultProps = defaultProps;
export default DiscussionAuthorsList;
