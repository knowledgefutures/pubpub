import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from '@blueprintjs/core';
import { Avatar } from 'components';

require('./preview.scss');

const propTypes = {
	threadData: PropTypes.array.isRequired,
	isCollapsed: PropTypes.bool.isRequired,
	dispatch: PropTypes.func.isRequired,
	discussionsState: PropTypes.object.isRequired,
	setActiveHighlightId: PropTypes.func.isRequired,
};

const Preview = (props) => {
	const { threadData, dispatch, discussionsState, setActiveHighlightId, isCollapsed } = props;
	if (!threadData) {
		return null;
	}
	const primaryId = threadData[0].id;

	const truncateText = (text) => {
		const previewLimit = 45;
		return text.length > previewLimit ? `${text.substring(0, previewLimit - 3)}...` : text;
	};
	return (
		<Button
			className={classNames({
				'pub-discussions_side-previews_preview': true,
				collapsed: isCollapsed,
			})}
			minimal={true}
			onClick={() => {
				dispatch({
					id: primaryId,
					key: 'isOpen',
					value: !(discussionsState[primaryId] && discussionsState[primaryId].isOpen),
				});
			}}
			onMouseEnter={() => {
				setActiveHighlightId(primaryId);
			}}
			onMouseLeave={() => {
				setActiveHighlightId(undefined);
			}}
			text={
				<React.Fragment>
					{threadData.map((discussion, index, array) => {
						const limit = isCollapsed ? 4 : 2;
						if (index === limit) {
							return (
								<div key={discussion.id} className="item">
									<Avatar
										width={19}
										userInitials={String(array.length - limit)}
									/>
								</div>
							);
						}
						if (index > limit) {
							return null;
						}
						return (
							<div key={discussion.id} className="item">
								<Avatar
									width={19}
									userInitials={discussion.author.intials}
									userAvatar={discussion.author.avatar}
								/>
								{!isCollapsed && (
									<span className="text">
										<b>{discussion.author.fullName}</b>:{' '}
										{truncateText(discussion.text)}
									</span>
								)}
								{!isCollapsed && <div className="line" />}
							</div>
						);
					})}
				</React.Fragment>
			}
		/>
	);
};

Preview.propTypes = propTypes;
export default Preview;
