import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { AnchorButton, Button, Callout, Classes, Dialog, Icon, Checkbox } from '@blueprintjs/core';

import { MinimalEditor } from 'components';
import { usePageContext } from 'utils/hooks';
import { formatDate } from 'utils/dates';
import { pubUrl } from 'utils/canonicalUrls';
import { apiFetch } from 'client/utils/apiFetch';

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

const createRelease = ({
	draftKey,
	pubId,
	communityId,
	noteContent,
	noteText,
	makeDraftDiscussionsPublic,
}) =>
	apiFetch('/api/releases', {
		method: 'POST',
		body: JSON.stringify({
			pubId: pubId,
			communityId: communityId,
			noteContent: noteContent,
			noteText: noteText,
			draftKey: draftKey,
			makeDraftDiscussionsPublic: makeDraftDiscussionsPublic,
		}),
	});

const PubReleaseDialog = (props) => {
	const { isOpen, onClose, historyData, pubData, updatePubData } = props;
	const {
		communityData,
		scopeData: {
			activePermissions: { isSuperAdmin },
		},
	} = usePageContext();
	const [noteData, setNoteData] = useState({});
	const [makeDraftDiscussionsPublic, setMakeDraftDiscussionsPublic] = useState(false);
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
			makeDraftDiscussionsPublic: makeDraftDiscussionsPublic,
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
					Your Release was succesfully created!
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
					Create Release
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
			lazy={true}
			title="Publish"
			onClose={onClose}
			isOpen={isOpen}
			className="pub-release-dialog-component"
		>
			<div className={Classes.DIALOG_BODY}>
				{!createdRelease && (
					<React.Fragment>
						<p>
							To publish this pub, you can create a Release that will be publicly
							visible.
						</p>
						{latestRelease && renderLatestReleaseInfo(latestRelease)}
						<MinimalEditor
							onChange={(data) => {
								setNoteData(data);
							}}
							focusOnLoad={true}
							placeholder="Add a (publicly-visible) note describing this release."
						/>
						{isSuperAdmin && (
							<Checkbox
								checked={makeDraftDiscussionsPublic}
								onChange={() =>
									setMakeDraftDiscussionsPublic(!makeDraftDiscussionsPublic)
								}
								label="Make all discussions on the draft visible to the public"
							/>
						)}
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
