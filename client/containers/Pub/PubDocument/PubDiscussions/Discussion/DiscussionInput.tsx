import type { AltchaRef } from 'components';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { AnchorButton, Button, InputGroup, Intent } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { Altcha, Avatar, Honeypot } from 'components';
import Editor, {
	convertLocalHighlightToDiscussion,
	getJSON,
	getLocalHighlightText,
	getText,
	getTopLevelImages,
	removeLocalHighlight,
} from 'components/Editor';
import { buttons, FormattingBar } from 'components/FormattingBar';
import { usePubContext } from 'containers/Pub/pubHooks';
import { usePageContext } from 'utils/hooks';

type OwnProps = {
	discussionData: any;
	isPubBottomInput?: boolean;
};

const defaultProps = {
	isPubBottomInput: false,
};

const getPlaceholderText = (isNewThread, isPubBottomInput) => {
	if (isPubBottomInput) {
		return 'Start a discussion here (or highlight some text above to begin one inline)';
	}
	return isNewThread ? 'Add your discussion...' : 'Add a reply...';
};

type Props = OwnProps & typeof defaultProps;

const DiscussionInput = (props: Props) => {
	const { discussionData, isPubBottomInput } = props;
	const { pubData, historyData, collabData, updateLocalData } = usePubContext();
	const {
		loginData,
		locationData,
		communityData,
		scopeData: {
			activePermissions: { canEdit },
		},
	} = usePageContext();
	const pubView = collabData.editorChangeObject!.view;
	const [changeObject, setChangeObject] = useState<any>();
	const [isLoading, setIsLoading] = useState(false);
	const [didFocus, setDidFocus] = useState(false);
	const [editorKey, setEditorKey] = useState(Date.now());
	const [commenterName, setCommenterName] = useState('');
	const altchaRef = useRef<AltchaRef>(null);
	const isNewThread = !discussionData.number;
	const inputView = changeObject?.view;

	useEffect(() => {
		if (!isPubBottomInput && (isNewThread || didFocus) && inputView) {
			inputView.focus();
		}
	}, [isNewThread, inputView, didFocus, isPubBottomInput]);

	const postThreadCommentBody = () => ({
		accessHash: locationData.query.access,
		parentId: discussionData.id,
		threadId: discussionData.thread.id,
		pubId: pubData.id,
		communityId: communityData.id,
		content: getJSON(changeObject?.view),
		text: getText(changeObject?.view) || '',
		commentAccessHash: pubData.commentHash,
		commenterName,
	});

	const postDiscussionBody = () => {
		const initAnchorData = getLocalHighlightText(pubView, discussionData.id);
		return {
			accessHash: locationData.query.access,
			discussionId: discussionData.id,
			pubId: pubData.id,
			historyKey: historyData.currentKey,
			communityId: communityData.id,
			content: getJSON(changeObject?.view),
			text: getText(changeObject?.view) || '',
			initAnchorData,
			visibilityAccess: pubData.isRelease ? 'public' : 'members',
			commentAccessHash: pubData.commentHash,
			commenterName,
		};
	};

	const handlePostThreadComment = async (evt: React.FormEvent<HTMLFormElement>) => {
		evt.preventDefault();
		const formData = new FormData(evt.currentTarget);
		const honeypot = (formData.get('title') as string) ?? '';
		setIsLoading(true);
		try {
			const altchaPayload = await altchaRef.current?.verify();
			const outputData = await apiFetch('/api/threadComment/fromForm', {
				method: 'POST',
				body: JSON.stringify({
					...postThreadCommentBody(),
					_honeypot: honeypot,
					altcha: altchaPayload,
				}),
			});
			updateLocalData('pub', {
				discussions: pubData.discussions.map((disc) => {
					if (disc.thread!.id === outputData.threadId) {
						return {
							...disc,
							thread: {
								...disc.thread,
								comments: [...(disc.thread!.comments ?? []), outputData],
							},
						};
					}
					return disc;
				}),
			});
		} finally {
			setIsLoading(false);
			if (isPubBottomInput) setEditorKey(Date.now());
		}
	};

	const handlePostDiscussion = async (evt: React.FormEvent<HTMLFormElement>) => {
		evt.preventDefault();
		const formData = new FormData(evt.currentTarget);
		const honeypot = (formData.get('title') as string) ?? '';
		setIsLoading(true);
		try {
			const altchaPayload = await altchaRef.current?.verify();
			const outputData = await apiFetch('/api/discussions/fromForm', {
				method: 'POST',
				body: JSON.stringify({
					...postDiscussionBody(),
					_honeypot: honeypot,
					altcha: altchaPayload,
				}),
			});
			updateLocalData('pub', {
				discussions: [...pubData.discussions, outputData],
			});
			if (!isPubBottomInput) convertLocalHighlightToDiscussion(pubView, outputData.id);
		} finally {
			setIsLoading(false);
			if (isPubBottomInput) setEditorKey(Date.now());
		}
	};

	const isLoggedIn = loginData.id;
	const redirectString = `?redirect=${locationData.path}${
		locationData.queryString.length > 1 ? locationData.queryString : ''
	}`;

	const canComment = isLoggedIn || pubData.isAVisitingCommenter;
	const isUser = !!(canEdit || loginData.fullName);

	const handleCommenterNameOnBlur = (evt) => {
		if (evt.key === 'Enter') {
			evt.currentTarget.blur();
		}
	};
	const handleInputChange = useCallback((e) => {
		setCommenterName(e.target.value);
	}, []);
	const renderUserNameInput = () => {
		return (
			!isUser &&
			pubData.isAVisitingCommenter && (
				<div className="simple-input guest-name-input">
					<p>Add your name?</p>
					<InputGroup
						value={commenterName}
						onChange={handleInputChange}
						onBlur={handleCommenterNameOnBlur}
						placeholder="Enter name here..."
					/>
				</div>
			)
		);
	};
	return (
		<div className="thread-comment-component input">
			<div className="avatar-wrapper">
				<Avatar width={18} initials={loginData.initials} avatar={loginData.avatar} />
			</div>
			{!canComment && (
				<React.Fragment>
					<AnchorButton
						className="discussion-primary-button"
						text="Login to discuss"
						href={`/login${redirectString}`}
						small={true}
					/>
					{isNewThread && !isPubBottomInput && (
						<Button
							className="discussion-cancel-button"
							text="Cancel"
							small={true}
							onClick={() => {
								removeLocalHighlight(pubView, discussionData.id);
							}}
						/>
					)}
				</React.Fragment>
			)}
			{canComment && !isNewThread && !didFocus && (
				<>
					<input
						type="text"
						className="simple-input"
						placeholder="Add a reply..."
						onFocus={() => {
							setDidFocus(true);
						}}
					/>
					{renderUserNameInput()}
				</>
			)}
			{canComment && (isNewThread || didFocus) && (
				<form
					onSubmit={isNewThread ? handlePostDiscussion : handlePostThreadComment}
					className="content-wrapper"
				>
					<Honeypot name="title" />
					<div className="discussion-body-wrapper editable">
						<FormattingBar
							editorChangeObject={changeObject}
							buttons={buttons.discussionButtonSet}
							isSmall
						/>
						<Editor
							key={editorKey}
							placeholder={getPlaceholderText(isNewThread, isPubBottomInput)}
							onChange={(editorChangeObject) => {
								setChangeObject(editorChangeObject);
							}}
						/>
						{renderUserNameInput()}
					</div>

					{/** we don't want to autorun the verification for new discussions, as that would always run verification on each page load
					 * we do want to run verification on load for replies, as you need to open the specific discussion to reply to it, and otherwise
					 * the processes doesn't work very smoothly (need to press "Post reply" twice, once to trigger verification, and once to actually submit the form)
					 */}
					<Altcha ref={altchaRef} auto={isNewThread ? 'onfocus' : 'onload'} />
					<Button
						className="discussion-primary-button"
						intent={Intent.PRIMARY}
						type="submit"
						text={isNewThread ? 'Post Discussion' : 'Post Reply'}
						loading={isLoading}
						disabled={
							!getText(changeObject?.view) &&
							!getTopLevelImages(changeObject?.view).length
						}
						small={true}
					/>
					{isNewThread && !isPubBottomInput && (
						<Button
							className="discussion-cancel-button"
							text="Cancel"
							type="button"
							small={true}
							onClick={() => {
								removeLocalHighlight(pubView, discussionData.id);
							}}
						/>
					)}
				</form>
			)}
		</div>
	);
};
DiscussionInput.defaultProps = defaultProps;
export default DiscussionInput;
