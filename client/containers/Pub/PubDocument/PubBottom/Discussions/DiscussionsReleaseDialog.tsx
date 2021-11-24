import React, { useCallback, useState } from 'react';
import { Button, Callout, Checkbox, Classes, Dialog, IDialogProps, Label } from '@blueprintjs/core';

import { Community, Pub, PubPageData, PubPageDiscussion } from 'types';
import { apiFetch } from 'client/utils/apiFetch';
import { usePageContext } from 'utils/hooks';
import { pubUrl } from 'utils/canonicalUrls';

import Discussion from '../../PubDiscussions/Discussion';

require('./discussionsReleaseDialog.scss');

type Props = {
	pubData: PubPageData;
} & Pick<IDialogProps, 'onClose' | 'isOpen'>;

type State = 'ready' | 'releasing' | 'error';

const navigateToRelease = (community: Community, pub: Pub) => {
	window.location.href = pubUrl(community, pub);
};

const DiscussionsReleaseDialog = (props: Props) => {
	const { pubData, onClose, isOpen } = props;
	const { discussions } = pubData;
	const [selectedDiscussionIds, setSelectedDiscussionIds] = useState<string[]>([]);
	const [state, setState] = useState<State>('ready');
	const { communityData } = usePageContext();

	const toggleDiscussionIdSelected = useCallback((id: string) => {
		setSelectedDiscussionIds((discussionIds) => {
			if (discussionIds.includes(id)) {
				return discussionIds.filter((otherId) => otherId !== id);
			}
			return [...discussionIds, id];
		});
	}, []);

	const handleReleaseDiscussions = () => {
		setState('releasing');
		apiFetch
			.put('/api/discussions/release', {
				pubId: pubData.id,
				discussionIds: selectedDiscussionIds,
			})
			.then(() => navigateToRelease(communityData, pubData))
			.catch(() => setState('error'));
	};

	const renderDiscussionEntry = (discussion: PubPageDiscussion) => {
		const included = selectedDiscussionIds.includes(discussion.id);
		return (
			<Label key={discussion.id} className="discussion-entry">
				<Checkbox
					checked={included}
					onClick={() => toggleDiscussionIdSelected(discussion.id)}
				/>
				<Discussion
					discussionData={discussion}
					pubData={pubData}
					updateLocalData={() => {}}
					canPreview
				/>
			</Label>
		);
	};

	return (
		<Dialog
			className="discussions-release-dialog-component"
			onClose={onClose}
			isOpen={isOpen}
			title="Release Discussions"
		>
			<div className={Classes.DIALOG_BODY}>
				<p>
					Select discussions to move from the draft to the latest Release. Once they're
					moved, you won't be able to undo this action (though you may be able to ask Ian
					to do it for you 😊)
				</p>
				<div className="discussions-listing">{discussions.map(renderDiscussionEntry)}</div>
				{state === 'error' && <Callout intent="warning" title="An error occurred." />}
			</div>
			<div className={Classes.DIALOG_FOOTER}>
				<Button
					intent="primary"
					onClick={handleReleaseDiscussions}
					loading={state === 'releasing'}
				>
					Fire away!
				</Button>
			</div>
		</Dialog>
	);
};

export default DiscussionsReleaseDialog;
