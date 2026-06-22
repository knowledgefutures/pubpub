import type {
	Discussions,
	DiscussionsHandler,
	NullableDiscussions,
	RemoteDiscussions,
} from './types';

/**
 * Connects to the server-side discussion position sync via polling.
 * Replaces the previous Firebase-based implementation.
 *
 * Discussion positions are stored in Postgres and broadcast via Valkey pub/sub.
 * This client polls the server endpoint for updates and posts local changes.
 */
export const connectToRemoteDiscussions = (pubId: string): RemoteDiscussions => {
	let onDiscussions: null | DiscussionsHandler = null;
	let pollInterval: ReturnType<typeof setInterval> | null = null;
	let lastKnownDiscussions: NullableDiscussions = {};

	const fetchDiscussions = async () => {
		try {
			const response = await fetch(`/api/pubs/${pubId}/discussions/positions`);

			if (!response.ok) {
				return;
			}

			const discussions = (await response.json()) as NullableDiscussions;

			const hasChanges = Object.keys(discussions).some((id) => {
				const remote = discussions[id];
				const local = lastKnownDiscussions[id];

				if (!remote && !local) return false;
				if (!remote || !local) return true;

				return (
					remote.currentKey !== local.currentKey ||
					remote.selection?.anchor !== local.selection?.anchor ||
					remote.selection?.head !== local.selection?.head
				);
			});

			if (hasChanges) {
				lastKnownDiscussions = discussions;
				onDiscussions?.(discussions);
			}
		} catch (_err) {
			// non-fatal, will retry on next poll
		}
	};

	const sendDiscussions = (discussions: Discussions) => {
		if (Object.keys(discussions).length === 0) {
			return;
		}

		fetch(`/api/pubs/${pubId}/discussions/positions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(discussions),
		}).catch(() => {
			// non-fatal
		});
	};

	const receiveDiscussions = (handler: DiscussionsHandler) => {
		onDiscussions = handler;
	};

	// start polling
	fetchDiscussions();
	pollInterval = setInterval(fetchDiscussions, 3000);

	const disconnect = () => {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}

		onDiscussions = null;
	};

	return {
		sendDiscussions,
		receiveDiscussions,
		disconnect,
	};
};
