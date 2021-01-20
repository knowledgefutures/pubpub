import { uncompressSelectionJSON, compressSelectionJSON } from 'prosemirror-compress-pubpub';

import {
	DiscussionInfo,
	CompressedDiscussionInfo,
	DiscussionsHandler,
	Discussions,
	RemoteDiscussions,
} from './types';

type Reference = firebase.database.Reference;
type DataSnapshot = firebase.database.DataSnapshot;

const uncompressDiscussionInfo = (compressed: CompressedDiscussionInfo): DiscussionInfo => {
	const { selection: compressedSelection } = compressed;
	const selection = compressedSelection && uncompressSelectionJSON(compressedSelection);
	return { ...compressed, selection: selection };
};

const compressDiscussionInfo = (uncompressed: DiscussionInfo): CompressedDiscussionInfo => {
	const { selection: uncompressedSelection } = uncompressed;
	const selection = uncompressedSelection && compressSelectionJSON(uncompressedSelection);
	return { ...uncompressed, selection: selection };
};

export const connectToFirebaseDiscussions = (draftRef: Reference): RemoteDiscussions => {
	const discussionsRef = draftRef.child('discussions');
	let onDiscussions: null | DiscussionsHandler = null;
	let disconnect: null | (() => void) = null;

	const childAddedHandler = (snapshot: DataSnapshot) => {
		const discussion = snapshot.val();
		if (discussion) {
			onDiscussions?.({ [snapshot.key!]: uncompressDiscussionInfo(discussion) });
		}
	};

	const childRemovedHandler = (snapshot: DataSnapshot) => {
		onDiscussions?.({ [snapshot.key!]: null });
	};

	const sendDiscussions = (discussions: Discussions) => {
		Object.entries(discussions).forEach(([id, discussion]) => {
			discussionsRef
				.child(id)
				.transaction((existingDiscussion: null | CompressedDiscussionInfo) => {
					if (
						!existingDiscussion ||
						discussion.currentKey >= existingDiscussion.currentKey
					) {
						return compressDiscussionInfo(discussion);
					}
					return undefined;
				});
		});
	};

	const connectHandler = (handler: DiscussionsHandler) => {
		onDiscussions = handler;
	};

	const connect = () => {
		discussionsRef.on('child_added', childAddedHandler);
		discussionsRef.on('child_removed', childRemovedHandler);
		return () => {
			discussionsRef.on('child_added', childAddedHandler);
			discussionsRef.on('child_removed', childRemovedHandler);
		};
	};

	discussionsRef.once('value').then((snapshot) => {
		const discussionsById = snapshot.val();
		if (discussionsById) {
			const uncompressedDiscussionsById: Discussions = {};
			Object.entries(discussionsById).forEach(([id, discussion]) => {
				uncompressedDiscussionsById[id] = uncompressDiscussionInfo(discussion as any);
			});
			onDiscussions?.(uncompressedDiscussionsById);
		}
		disconnect = connect();
	});

	return {
		sendDiscussions: sendDiscussions,
		receiveDiscussions: connectHandler,
		disconnect: () => disconnect?.(),
	};
};
