import React from 'react';
import PropTypes from 'prop-types';
import { initFirebase } from 'utils/firebaseClient';

const propTypes = {
	pubData: PropTypes.object.isRequired,
	children: PropTypes.func.isRequired,
};

class PubSyncManager extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			firebaseRootRef: undefined,
			firebaseBranchRef: undefined,
			pubData: this.props.pubData,
			collabData: {
				editorChangeObject: {},
				status: 'connecting',
			},
		};
		this.syncMetadata = this.syncMetadata.bind(this);
		this.updatePubData = this.updatePubData.bind(this);
		this.updateCollabData = this.updateCollabData.bind(this);
		this.updateLocalData = this.updateLocalData.bind(this);
	}

	componentDidMount() {
		const rootKey = `pub-${this.props.pubData.id}`;
		const branchKey = `branch-${this.props.pubData.activeBranch.id}`;
		initFirebase(rootKey, this.props.pubData.firebaseToken).then(([rootRef, connectionRef]) => {
			this.setState({
				firebaseRootRef: rootRef,
				firebaseBranchRef: rootRef.child(branchKey),
			});

			this.state.firebaseRootRef.child('metadata').on('child_changed', this.syncMetadata);

			connectionRef.on('value', (snapshot) => {
				if (snapshot.val() === true) {
					this.updateLocalData('collab', { status: 'connected' });
				} else {
					this.updateLocalData('collab', { status: 'disconnected' });
				}
			});
		});
	}

	componentWillUnmount() {
		if (this.state.firebaseRootRef) {
			this.state.firebaseRootRef.child('metadata').off('child_changed', this.syncMetadata);
		}
	}

	syncMetadata(snapshot) {
		this.setState((prevState) => {
			return {
				pubData: {
					...prevState.pubData,
					[snapshot.key]: snapshot.val(),
				},
			};
		});
	}

	updatePubData(newPubData) {
		/* First, set the local state. */
		/* Then, sync appropriate data to firebase. */
		/* Other clients will receive updates which */
		/* triggers the syncMetadata function. */
		this.setState(
			(prevState) => {
				return {
					pubData: {
						...prevState.pubData,
						...newPubData,
					},
				};
			},
			() => {
				const keysToSync = [
					'attributions',
					'avatar',
					'branches',
					'citationData',
					'description',
					'discussions',
					'doi',
					'downloads',
					'isCommunityAdminManaged',
					'labels',
					'managers',
					'pubTags',
					'slug',
					'title',
					'useHeaderImage',
				];
				const firebaseSyncData = {};
				keysToSync.forEach((key) => {
					if (key in newPubData) {
						firebaseSyncData[key] = newPubData[key];
					}
				});
				const hasUpdates = Object.keys(firebaseSyncData).length;
				if (this.state.firebaseRootRef && hasUpdates) {
					this.state.firebaseRootRef.child('metadata').update(firebaseSyncData);
				}
			},
		);
	}

	updateCollabData(newCollabData) {
		this.setState((prevState) => {
			return {
				collabData: {
					...prevState.collabData,
					...newCollabData,
				},
			};
		});
	}

	updateLocalData(type, data) {
		if (type === 'pub') {
			this.updatePubData(data);
		}
		if (type === 'collab') {
			this.updateCollabData(data);
		}
	}

	render() {
		return this.props.children({
			pubData: this.state.pubData,
			collabData: this.state.collabData,
			firebaseBranchRef: this.state.firebaseBranchRef,
			updateLocalData: this.updateLocalData,
		});
	}
}

PubSyncManager.propTypes = propTypes;
export default PubSyncManager;
