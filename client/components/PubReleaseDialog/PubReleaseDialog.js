import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { AnchorButton, Button, Callout, Classes, Dialog, Icon } from '@blueprintjs/core';

import { MinimalEditor } from 'components';
import { apiFetch } from 'utils';
import { usePageContext } from 'utils/hooks';
import { formatDate } from 'shared/utils/dates';
import { pubUrl } from 'shared/utils/canonicalUrls';

require('./pubReleaseDialog.scss');

const propTypes = {
	historyData: PropTypes.shape({ latestKey: PropTypes.number }).isRequired,
	isOpen: PropTypes.bool.isRequired,
	pubData: PropTypes.shape({
		id: PropTypes.string,
		releases: PropTypes.arrayOf(PropTypes.shape({})),
	}).isRequired,
	onClose: PropTypes.func.isRequired,
	updatePubData: PropTypes.func.isRequired,
};

const defaultProps = {};

const createRelease = ({ draftKey, pubId, communityId, noteContent, noteText }) =>
	apiFetch('/api/releases', {
		method: 'POST',
		body: JSON.stringify({
			pubId: pubId,
			communityId: communityId,
			noteContent: noteContent,
			noteText: noteText,
			draftKey: draftKey,
		}),
	});

const PubReleaseDialog = (props) => {
	const { isOpen, onClose, historyData, pubData, updatePubData } = props;
	const { communityData } = usePageContext();
	const [noteData, setNoteData] = useState({});
	const [isCreatingRelease, setIsCreatingRelease] = useState(false);
	const [createdRelease, setCreatedRelease] = useState(false);
	const [releaseError, setReleleaseError] = useState(null);
	const latestRelease = pubData.releases[pubData.releases.length - 1];

	const handleCreateRelease = async () => {
		setIsCreatingRelease(true);
		createRelease({
			communityId: communityData.id,
			pubId: pubData.id,
			noteContent: noteData.content,
			noteText: noteData.text,
			draftKey: historyData.latestKey,
		})
			.then(({ release }) => {
				setReleleaseError(null);
				setCreatedRelease(release);
				setIsCreatingRelease(false);
				updatePubData((currentPubData) => {
					return {
						releases: [...currentPubData.releases, release],
					};
				});
			})
			.catch((err) => {
				setReleleaseError(err);
				setIsCreatingRelease(false);
			});
	};

	const renderLatestReleaseInfo = (release) => {
		const dateString = formatDate(release.createdAt, {
			includeTime: true,
			includePreposition: true,
		});
		const releaseUrl = pubUrl(communityData, pubData, { releaseNumber: release.branchKey + 1 });
		return (
			<p>
				<a href={releaseUrl} rel="noopener noreferrer" target="_blank">
					The most recent release
				</a>{' '}
				was made {dateString}. This will update the version of the Pub that readers see, but
				they'll still be able to view previous releases by clicking the{' '}
				<Icon icon="history" iconSize={12} /> History button on the Pub header.
			</p>
		);
	};

	const renderReleaseResult = () => {
		if (releaseError) {
			return <Callout intent="warning" title="There was an error creating this release." />;
		}
		if (createdRelease) {
			return (
				<Callout intent="success" title="Created release!">
					This Pub is now visible for the world to see.
				</Callout>
			);
		}
		return null;
	};

	const renderPreReleaseButtons = () => {
		return (
			<React.Fragment>
				<Button disabled={isCreatingRelease} onClick={onClose}>
					Cancel
				</Button>
				<Button loading={isCreatingRelease} intent="primary" onClick={handleCreateRelease}>
					Release
				</Button>
			</React.Fragment>
		);
	};

	const renderPostReleaseButtons = () => {
		return (
			<React.Fragment>
				<Button onClick={onClose}>Close</Button>
				<AnchorButton intent="primary" href={pubUrl(communityData, pubData)}>
					Go to Release
				</AnchorButton>
			</React.Fragment>
		);
	};

	return (
		<Dialog
			title="Release this Pub"
			onClose={onClose}
			isOpen={isOpen}
			className="pub-release-dialog-component"
		>
			<div className={Classes.DIALOG_BODY}>
				{!createdRelease && (
					<React.Fragment>
						<p>You're about to release this Pub, making it visible to everyone.</p>
						{latestRelease && renderLatestReleaseInfo(latestRelease)}
						<MinimalEditor
							onChange={(data) => {
								setNoteData(data);
							}}
							focusOnLoad={true}
							placeholder="Add a note describing this release."
						/>
					</React.Fragment>
				)}
				{renderReleaseResult()}
			</div>
			<div className={Classes.DIALOG_FOOTER}>
				<div className={Classes.DIALOG_FOOTER_ACTIONS}>
					{createdRelease && renderPostReleaseButtons()}
					{!createdRelease && renderPreReleaseButtons()}
				</div>
			</div>
		</Dialog>
	);
};

PubReleaseDialog.propTypes = propTypes;
PubReleaseDialog.defaultProps = defaultProps;
export default PubReleaseDialog;
