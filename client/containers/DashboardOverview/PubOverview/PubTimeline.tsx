/* eslint-disable react/no-danger */
import React from 'react';
import { AnchorButton, Button, Classes, Popover } from '@blueprintjs/core';

import { Icon, Timeline, TimelineItem, TimelineCondenser } from 'components';
import { usePageContext } from 'utils/hooks';
import { formatDate } from 'utils/dates';
import { pubUrl } from 'utils/canonicalUrls';
import { PubPageData } from 'utils/types';

require('./pubTimeline.scss');

type Props = {
	pubData: PubPageData;
};

const PubTimeline = (props: Props) => {
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
	const latestKeyAt = pubData.draft?.latestKeyAt;
	const hasDraftContent = !!latestKeyAt;

	const draftLastEditedNotice = latestKeyAt
		? `Last edited ${formatDate(latestKeyAt, { includeTime: true })}`
		: 'Get started by editing the Pub draft.';

	const draftItem = (canView || canViewDraft) && (
		<TimelineItem
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
			large
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
			hollow={hasDraftContent}
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
			icon="edit"
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
			title="Pub draft"
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
			subtitle={draftLastEditedNotice}
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
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
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
				hollow
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
				large={isLatest}
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				icon="document-share"
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
				key={release.id}
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
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
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				subtitle={formatDate(release.createdAt, { includeTime: true })}
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
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
				and click the <Icon icon="document-share" iconSize={12} /> Publish button in the
				header to create a release.
			</div>
		);

		return (
			<TimelineItem
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
				large
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				icon="document-share"
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
				title={<i>No releases yet</i>}
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				subtitle="Create a Release to share this Pub with the world."
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
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
		// @ts-expect-error ts-migrate(2746) FIXME: This JSX tag's 'children' prop expects a single ch... Remove this comment to see the full error message
		<Timeline className="pub-timeline-component" accentColor={communityData.accentColorDark}>
			{releases.length === 0 && hasDraftContent && renderNoReleasesItem()}
			{draftItem}
			{latestRelease && renderReleaseItem(latestRelease, releases.length, true)}
			{/* @ts-expect-error ts-migrate(2786) FIXME: 'TimelineCondenser' cannot be used as a JSX compon... Remove this comment to see the full error message */}
			<TimelineCondenser shownItemsLimit={4}>
				{olderReleases
					.map((release, index) => renderReleaseItem(release, index + 1))
					.reverse()}
			</TimelineCondenser>
			<TimelineItem
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
				hollow
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
				large
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				title="Pub created"
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				subtitle={formatDate(pubData.createdAt, { includeTime: true })}
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				icon="clean"
			/>
		</Timeline>
	);
};
export default PubTimeline;
