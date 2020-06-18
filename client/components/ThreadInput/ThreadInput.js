import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { AnchorButton, Button, Intent } from '@blueprintjs/core';

import { Avatar } from 'components';
import Editor, { getText, getJSON } from 'components/Editor';
import FormattingBarLegacy from 'components/FormattingBarLegacy/FormattingBar';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';

require('./threadInput.scss');

const propTypes = {
	parentId: PropTypes.string.isRequired,
	pubId: PropTypes.string.isRequired,
	threadData: PropTypes.object.isRequired,
	onThreadUpdate: PropTypes.func,
};

const defaultProps = {
	onThreadUpdate: () => {},
};

const ThreadInput = (props) => {
	const { parentId, threadData, pubId, onThreadUpdate } = props;
	const { loginData, locationData, communityData } = usePageContext();
	const [changeObject, setChangeObject] = useState({});
	const [editorKey, setEditorKey] = useState(Date.now());
	const [isLoading, setIsLoading] = useState(false);

	const handlePostThreadComment = async () => {
		setIsLoading(true);
		const outputData = await apiFetch('/api/threadComment', {
			method: 'POST',
			body: JSON.stringify({
				accessHash: locationData.query.access,
				parentId: parentId,
				threadId: threadData.id,
				pubId: pubId,
				communityId: communityData.id,
				content: getJSON(changeObject.view),
				text: getText(changeObject.view) || '',
			}),
		});

		const newThread = {
			...threadData,
			comments: [...threadData.comments, outputData],
		};
		onThreadUpdate(newThread);
		setIsLoading(false);
		setEditorKey(Date.now());
	};

	/* ThreadInput shares much of the same styling with the  */
	/* thread-comment2-component */
	return (
		<div className="thread-input-component">
			{!loginData.id && (
				<div className="thread-input-component">
					<AnchorButton
						text="Login to Reply"
						href={`/login?redirect=${locationData.path}`}
						large
					/>
				</div>
			)}
			{loginData.id && (
				<React.Fragment>
					<div className="thread-comment2-component">
						<div className="header">
							<Avatar
								width={30}
								intials={loginData.initials}
								avatar={loginData.avatar}
							/>
							<div className="comment-title">Reply as {loginData.fullName}</div>
							<div>
								<FormattingBarLegacy
									editorChangeObject={changeObject}
									hideBlocktypes={true}
									hideExtraFormatting={true}
								/>
							</div>
						</div>
						<div className="content">
							<Editor
								key={editorKey}
								placeholder="Add a comment..."
								onChange={(editorChangeObject) => {
									setChangeObject(editorChangeObject);
								}}
							/>
						</div>
					</div>
					<Button
						className="comment-button"
						text="Add Comment"
						intent={Intent.PRIMARY}
						loading={isLoading}
						onClick={handlePostThreadComment}
					/>
				</React.Fragment>
			)}
		</div>
	);
};

ThreadInput.propTypes = propTypes;
ThreadInput.defaultProps = defaultProps;
export default ThreadInput;
