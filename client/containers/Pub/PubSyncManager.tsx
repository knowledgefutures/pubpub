import React from 'react';
import queryString from 'query-string';
import firebase from 'firebase';

import { getRandomColor } from 'utils/colors';
import { getPubPageTitle } from 'utils/pubPageTitle';
import { NoteManager } from 'client/utils/notes';
import { initFirebase } from 'client/utils/firebaseClient';
import { apiFetch } from 'client/utils/apiFetch';
import { NodeLabelMap } from 'client/components/Editor/types';
import {
	Maybe,
	PatchFn,
	PatchFnArg,
	PubPageData,
	Community,
	LoginData,
	LocationData,
	PubHistoryState,
} from 'types';

const shimPubContextProps = {
	inPub: false,
	pubData: {
		nodeLabels: {} as NodeLabelMap | undefined,
		slug: '',
		isReadOnly: false,
		releases: [],
		releaseNumber: 0,
	},
	collabData: { editorChangeObject: {} },
	historyData: {},
	firebaseDraftRef: null,
	updateLocalData: null as any,
	updatePubData: (() => {}) as any,
	noteManager: new NoteManager('apa', 'count', {}),
} as any;

type Props = {
	pubData: PubPageData;
	locationData: LocationData;
	communityData: Community;
	loginData: LoginData;
	children: (ctx: typeof shimPubContextProps) => React.ReactNode;
};

type CollabUser = {
	id: string;
	backgroundColor: string;
	cursorColor: string;
	image: Maybe<string>;
	name: string;
	initials: string;
	canEdit: boolean;
};

type State = {
	pubData: PubPageData;
	historyData: PubHistoryState;
	collabData: {
		editorChangeObject: any;
		status: string;
		localCollabUser: CollabUser;
		remoteCollabUsers: CollabUser[];
	};
	firebaseDraftRef: null | firebase.database.Reference;
	noteManager: NoteManager;
};

export type PubContextType = State & {
	inPub: boolean;
	updateLocalData: (type: string, patcher: PatchFnArg<any>) => unknown;
	updatePubData: PatchFn<PubPageData>;
};

export const PubContext = React.createContext<PubContextType>(shimPubContextProps);

const fetchVersionFromHistory = (pubData, historyKey, accessHash) =>
	apiFetch(
		'/api/pubHistory?' +
			queryString.stringify({
				pubId: pubData.id,
				communityId: pubData.communityId,
				historyKey,
				accessHash,
			}),
	);

const getLocalCollabUser = (pubData, loginData) => {
	const userColor = getRandomColor(loginData.id);
	return {
		id: loginData.id,
		backgroundColor: `rgba(${userColor}, 0.2)`,
		cursorColor: `rgba(${userColor}, 1.0)`,
		image: loginData.avatar || null,
		name: loginData.fullName || 'Anonymous',
		initials: loginData.initials || '?',
		canEdit: !!pubData.canEdit,
	};
};

const idleStateUpdater = (boundSetState, timeout = 50) => {
	let queue: any[] = [];
	let idleCallback = null;

	const setStateNow = () =>
		boundSetState((prevState) => {
			idleCallback = null;
			let state = prevState;
			const itemsInQueue = queue.length;
			queue.forEach(([update, maybeCallback]) => {
				const partial = typeof update === 'function' ? update(state) : update;
				state = {
					...state,
					...partial,
				};
				if (maybeCallback) {
					maybeCallback(state);
				}
			});
			queue = queue.slice(itemsInQueue);
			return state;
		});

	const setState = (...args) => {
		queue.push(args);
		if ('requestIdleCallback' in window) {
			if (!idleCallback) {
				// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'requestIdleCallback'.
				idleCallback = requestIdleCallback(setStateNow, { timeout });
			}
		} else {
			setStateNow();
		}
	};

	const immediately = (isImmediate = true) => {
		return {
			setState: (...args) => {
				if (isImmediate) {
					queue.push(args);
					setStateNow();
				} else {
					setState(...args);
				}
			},
		};
	};

	return {
		setState,
		immediately,
	};
};
class PubSyncManager extends React.Component<Props, State> {
	idleStateUpdater: ReturnType<typeof idleStateUpdater>;

	constructor(props: Props) {
		super(props);
		const { pubData } = this.props;
		const { historyData } = pubData;
		const isViewingHistory = historyData.currentKey !== historyData.latestKey;

		this.state = {
			firebaseDraftRef: null,
			pubData: this.props.pubData,
			collabData: {
				editorChangeObject: {},
				status: 'connecting',
				localCollabUser: getLocalCollabUser(pubData, this.props.loginData),
				remoteCollabUsers: [],
			},
			historyData: {
				...historyData,
				outstandingRequests: 0,
				latestKeyReceivedAt: null,
				isViewingHistory,
				loadedIntoHistory: isViewingHistory,
				historyDocKey: `history-${historyData.currentKey}`,
			},
			noteManager: new NoteManager(
				pubData.citationStyle,
				pubData.citationInlineStyle,
				pubData.initialStructuredCitations,
			),
		};
		this.idleStateUpdater = idleStateUpdater(this.setState.bind(this));
		this.syncRemoteCollabUsers = this.syncRemoteCollabUsers.bind(this);
		this.syncDiscussionsContent = this.syncDiscussionsContent.bind(this);
		this.updatePubData = this.updatePubData.bind(this);
		this.updateCollabData = this.updateCollabData.bind(this);
		this.updateLocalData = this.updateLocalData.bind(this);
		if (typeof window !== 'undefined') {
			// eslint-disable-next-line no-underscore-dangle
			// @ts-expect-error
			window.__pubId__ = this.props.pubData.id;
		}
	}

	componentDidMount() {
		const { draft } = this.props.pubData;
		if (draft) {
			initFirebase(draft.firebasePath, this.props.pubData.firebaseToken).then(
				(firebaseRefs) => {
					if (!firebaseRefs) {
						return;
					}
					const [draftRef, connectionRef] = firebaseRefs;
					this.setState({ firebaseDraftRef: draftRef }, () => {
						this.state.firebaseDraftRef
							?.child('cursors')
							.on('value', this.syncRemoteCollabUsers);

						connectionRef.on('value', (snapshot) => {
							if (snapshot.val() === true) {
								this.updateLocalData('collab', { status: 'connected' });
							} else {
								this.updateLocalData('collab', { status: 'disconnected' });
							}
						});
					});
				},
			);
		}
	}

	syncDiscussionsContent(snapshot) {
		this.idleStateUpdater.setState((prevState) => {
			const val = snapshot.val();
			if (val) {
				const syncedDiscussions = Object.values(val);
				const newSyncedDiscussions = syncedDiscussions.filter((item) => {
					const exists = prevState.pubData.discussions.find((existingItem) => {
						// @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
						return item.id === existingItem.id;
					});
					return !exists;
				});
				const updatedDiscussions = prevState.pubData.discussions.map(
					(existingDiscussion) => {
						const syncedContent = syncedDiscussions.find((item) => {
							// @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
							return item.id === existingDiscussion.id;
						});
						return {
							...existingDiscussion,
							// @ts-expect-error ts-migrate(2698) FIXME: Spread types may only be created from object types... Remove this comment to see the full error message
							...(syncedContent || {}),
						};
					},
				);
				return {
					pubData: {
						...prevState.pubData,
						discussions: [...newSyncedDiscussions, ...updatedDiscussions],
					},
				};
			}
			return null;
		});
	}

	syncRemoteCollabUsers(snapshot) {
		const { loginData } = this.props;
		const users = snapshot.val();
		if (users) {
			this.updateCollabData({
				// @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
				remoteCollabUsers: Object.values(users).filter((user) => user.id !== loginData.id),
			});
		}
	}

	updatePubData(newPubData, isImmediate = false) {
		this.idleStateUpdater.immediately(isImmediate).setState(
			(prevState) => {
				const nextData =
					typeof newPubData === 'function' ? newPubData(prevState.pubData) : newPubData;
				return {
					pubData: {
						...prevState.pubData,
						...nextData,
					},
				};
			},
			() => {
				if (typeof newPubData.title === 'string') {
					document.title = getPubPageTitle(
						{ ...this.state.pubData, title: newPubData.title },
						this.props.communityData,
					);
				}
			},
		);
	}

	updateCollabData(newCollabData) {
		this.idleStateUpdater.setState((prevState) => {
			return {
				collabData: {
					...prevState.collabData,
					...newCollabData,
				},
			};
		});
	}

	updateHistoryData(newHistoryData) {
		const { pubData, locationData } = this.props;
		const {
			historyData: prevHistoryData,
			collabData: { editorChangeObject },
		} = this.state;
		const now = Date.now();
		const nextHistoryData = { ...prevHistoryData, ...newHistoryData };
		const currentCollabDoc =
			editorChangeObject && editorChangeObject.view && editorChangeObject.view.state.doc;
		if (currentCollabDoc && nextHistoryData.currentKey === nextHistoryData.latestKey) {
			this.idleStateUpdater.setState(({ historyData }) => {
				const nextTimestamp = historyData.timestamps[nextHistoryData.currentKey] || now;
				// Don't add -1 (indicating a lack of entries) as a timestamp
				const timestampUpdate =
					nextHistoryData.currentKey >= 0
						? { [nextHistoryData.currentKey]: nextTimestamp }
						: {};
				return {
					historyData: {
						...historyData,
						...newHistoryData,
						historyDoc: currentCollabDoc.toJSON(),
						historyDocKey: `history-${nextHistoryData.currentKey}`,
						timestamps: {
							[-1]: new Date(pubData.createdAt).valueOf(),
							...historyData.timestamps,
							...timestampUpdate,
						},
					},
				};
			});
		} else {
			this.setState(
				({ historyData }) => ({
					historyData: {
						...historyData,
						outstandingRequests: historyData.outstandingRequests + 1,
					},
				}),
				() =>
					fetchVersionFromHistory(
						pubData,
						newHistoryData.currentKey,
						locationData.query.access,
					).then(({ doc, historyData: { timestamps } }) => {
						this.setState(({ historyData }) => ({
							historyData: {
								...historyData,
								...newHistoryData,
								historyDoc: doc,
								historyDocKey: `history-${nextHistoryData.currentKey}`,
								outstandingRequests: historyData.outstandingRequests - 1,
								timestamps: {
									...historyData.timestamps,
									...timestamps,
								},
							},
						}));
					}),
			);
		}
	}

	updateLocalData(type, data, { isImmediate = false } = {}) {
		if (type === 'pub') {
			this.updatePubData(data, isImmediate);
		}
		if (type === 'collab') {
			this.updateCollabData(data);
		}
		if (type === 'history') {
			this.updateHistoryData(data);
		}
	}

	render() {
		const context = {
			inPub: true,
			pubData: this.state.pubData,
			collabData: this.state.collabData,
			historyData: this.state.historyData,
			noteManager: this.state.noteManager,
			firebaseDraftRef: this.state.firebaseDraftRef,
			updateLocalData: this.updateLocalData,
			updatePubData: this.updatePubData,
		} as PubContextType;
		return (
			<PubContext.Provider value={context}>
				{this.props.children(context)}
			</PubContext.Provider>
		);
	}
}
export default PubSyncManager;
