/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';
import { AnchorButton, Button } from '@blueprintjs/core';

import { Timeline, TimelineItem, TimelineCondenser } from 'components';
import { usePageContext } from 'utils/hooks';
import { formatDate } from 'shared/utils/dates';
import { pubUrl } from 'shared/utils/canonicalUrls';

require('./pubTimeline.scss');

const propTypes = {
	pubData: PropTypes.shape({
		createdAt: PropTypes.any,
		branches: PropTypes.arrayOf(PropTypes.shape({ title: PropTypes.string })),
		releases: PropTypes.arrayOf(PropTypes.shape({ createdAt: PropTypes.any })),
	}).isRequired,
};

const PubTimeline = (props) => {
	const { pubData } = props;
	const {
		communityData,
		scopeData: {
			activePermissions: { canEdit, canEditDraft, canManage },
		},
	} = usePageContext();
	const { releases } = pubData;
	const olderReleases = releases.slice(0, releases.length - 1);
	const latestRelease = releases[releases.length - 1];

	const draftBranch = pubData.branches.find((br) => br.title === 'draft');
	const draftLastEditedDate = draftBranch.latestKeyAt;

	const draftLastEditedNotice = draftLastEditedDate
		? `Last edited ${formatDate(draftLastEditedDate, { includeTime: true })}`
		: 'Get started by editing the Pub draft';

	const draftItem = (canEdit || canEditDraft) && (
		<TimelineItem
			large
			icon="edit"
			title="Pub draft"
			subtitle={draftLastEditedNotice}
			controls={
				<AnchorButton outlined href={pubUrl(communityData, pubData, { isDraft: true })}>
					Go to draft
				</AnchorButton>
			}
		/>
	);

	const renderReleaseItem = (release, number, isLatest = false) => {
		return (
			<TimelineItem
				large={isLatest}
				icon="document-open"
				title={
					<a
						className="release-link"
						href={pubUrl(communityData, pubData, {
							releaseNumber: number,
						})}
					>
						Release #{number}
						{isLatest && ' (latest)'}
					</a>
				}
				subtitle={formatDate(release.createdAt, { includeTime: true })}
				controls={
					canManage &&
					release.noteText && (
						<details>
							<summary>See release notes</summary>
							<div dangerouslySetInnerHTML={{ __html: release.noteText }} />
						</details>
					)
				}
			/>
		);
	};

	return (
		<Timeline className="pub-timeline-component" accentColor={communityData.accentColorDark}>
			<TimelineItem
				large
				title="Pub created"
				subtitle={formatDate(pubData.createdAt, { includeTime: true })}
				icon="clean"
			/>
			<TimelineCondenser shownItemsLimit={4}>
				{olderReleases.map((release, index) => renderReleaseItem(release, index + 1))}
			</TimelineCondenser>
			{latestRelease && renderReleaseItem(latestRelease, releases.length, true)}
			{draftItem}
			{releases.length === 0 && (
				<TimelineItem
					hollow
					large
					icon="document-open"
					title={<i>No releases yet</i>}
					subtitle="Create a release to share this Pub with the world."
					controls={<Button outlined>Learn more</Button>}
				/>
			)}
		</Timeline>
	);
};

PubTimeline.propTypes = propTypes;
export default PubTimeline;
