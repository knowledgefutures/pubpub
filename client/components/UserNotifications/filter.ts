import { FilterTerm, PubNotificationsState, ThreadNotificationsState } from './types';

const match = (needle: string, haystack: string) => {
	return haystack.toLowerCase().includes(needle.toLowerCase().trim());
};

export const pubStateMatchesTerm = (pubState: PubNotificationsState, term: FilterTerm) => {
	const { pub, community } = pubState;
	if (term) {
		return (
			match(term, pub.title) ||
			match(term, community.title) ||
			match(term, community.subdomain)
		);
	}
	return true;
};

export const threadStateMatchesTerm = (threadState: ThreadNotificationsState, term: FilterTerm) => {
	if (term) {
		const matchesAuthor = threadState.activityItems.some((item) => {
			if (item.actor) {
				return match(term, item.actor.fullName);
			}
			return false;
		});
		if (matchesAuthor) {
			return true;
		}
		const { text } = threadState.notifications[0].activityItem.payload.threadComment;
		if (text && match(term, text)) {
			return true;
		}
		return false;
	}
	return true;
};
