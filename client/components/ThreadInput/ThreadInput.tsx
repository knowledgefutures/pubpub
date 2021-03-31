import React, { useState } from 'react';
import { AnchorButton, Button, Intent } from '@blueprintjs/core';

import { Avatar } from 'components';
import Editor, { getText, getJSON, EditorChangeObject } from 'components/Editor';
import { FormattingBar, buttons } from 'components/FormattingBar';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';

require('./threadInput.scss');

type OwnProps = {
	parentId: string;
	pubId: string;
	threadData: any;
	onThreadUpdate?: (...args: any[]) => any;
};

const defaultProps = {
	onThreadUpdate: () => {},
};

type Props = OwnProps & typeof defaultProps;

const ThreadInput = (props: Props) => {
	const { parentId, threadData, pubId, onThreadUpdate } = props;
	const { loginData, locationData, communityData } = usePageContext();
	const [changeObject, setChangeObject] = useState<EditorChangeObject>();
	const [editorKey, setEditorKey] = useState(Date.now());
	const [isLoading, setIsLoading] = useState(false);

	const handlePostThreadComment = async () => {
		setIsLoading(true);
		const outputData = await apiFetch('/api/threadComment', {
			method: 'POST',
			body: JSON.stringify({
				accessHash: locationData.query.access,
				parentId,
				threadId: threadData.id,
				pubId,
				communityId: communityData.id,
				// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
				content: getJSON(changeObject.view),
				// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
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
								initials={loginData.initials}
								avatar={loginData.avatar}
							/>
							<div className="comment-title">Reply as {loginData.fullName}</div>
							{changeObject && (
								<FormattingBar
									editorChangeObject={changeObject}
									buttons={buttons.discussionButtonSet}
									isSmall
								/>
							)}
						</div>
						<div className="content">
							<Editor
								key={editorKey}
								placeholder="Add a comment..."
								onChange={setChangeObject}
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
ThreadInput.defaultProps = defaultProps;
export default ThreadInput;
