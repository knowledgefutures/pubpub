/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';
import { AnchorButton, Button, Classes, Popover } from '@blueprintjs/core';

import { Icon, Timeline, TimelineItem, TimelineCondenser } from 'components';
import { usePageContext } from 'utils/hooks';
import { formatDate } from 'utils/dates';
import { pubUrl } from 'utils/canonicalUrls';

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
			activePermissions: { canView, canViewDraft, canManage },
		},
	} = usePageContext();
	const { releases } = pubData;
	const olderReleases = releases.slice(0, releases.length - 1);
	const latestRelease = releases[releases.length - 1];

	const draftBranch = pubData.branches.find((br) => br.title === 'draft');
	const hasDraftContent = !!draftBranch.latestKeyAt;

	const draftLastEditedNotice = hasDraftContent
		? `Last edited ${formatDate(draftBranch.latestKeyAt, { includeTime: true })}`
		: 'Get started by editing the Pub draft.';

	const draftItem = (canView || canViewDraft) && (
		<TimelineItem
			large
			hollow={hasDraftContent}
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
				hollow
				large={isLatest}
				icon="document-open"
				key={release.id}
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
						<details className="release-note">
							<summary>Release notes</summary>
							<div
								className="content"
								dangerouslySetInnerHTML={{ __html: release.noteText }}
							/>
						</details>
					)
				}
			/>
		);
	};

	const renderNoReleasesItem = () => {
		const popoverContent = (
			<div>
				A Release is a snapshot of a Pub that's visible to the public. Visit the Pub draft
				and click the <Icon icon="globe" iconSize={12} /> Publish button in the header to
				create a release.
			</div>
		);

		return (
			<TimelineItem
				large
				icon="document-open"
				title={<i>No releases yet</i>}
				subtitle="Create a Release to share this Pub with the world."
				controls={
					<Popover
						content={popoverContent}
						popoverClassName={Classes.POPOVER_CONTENT_SIZING}
					>
						<Button outlined>Learn more</Button>
					</Popover>
				}
			/>
		);
	};

	return (
		<Timeline className="pub-timeline-component" accentColor={communityData.accentColorDark}>
			{releases.length === 0 && hasDraftContent && renderNoReleasesItem()}
			{draftItem}
			{latestRelease && renderReleaseItem(latestRelease, releases.length, true)}
			<TimelineCondenser shownItemsLimit={4}>
				{olderReleases
					.map((release, index) => renderReleaseItem(release, index + 1))
					.reverse()}
			</TimelineCondenser>
			<TimelineItem
				hollow
				large
				title="Pub created"
				subtitle={formatDate(pubData.createdAt, { includeTime: true })}
				icon="clean"
			/>
		</Timeline>
	);
};

PubTimeline.propTypes = propTypes;
export default PubTimeline;
