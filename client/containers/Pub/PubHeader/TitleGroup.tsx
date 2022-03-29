import React from 'react';

import { PubByline, DialogLauncher, PubAttributionDialog } from 'components';
import { usePageContext } from 'utils/hooks';
import { getPubPublishedDate } from 'utils/pub/pubDates';
import { formatDate } from 'utils/dates';
import { PatchFn, Pub, PubPageData } from 'types';

import BylineEditButton from './BylineEditButton';
import EditableHeaderText from './EditableHeaderText';
import { usePubContext } from '../pubHooks';

type Props = {
	pubData: PubPageData;
	updatePubData: PatchFn<Pub>;
};

const TitleGroup = (props: Props) => {
	const { pubData, updatePubData } = props;
	const { title, description, isRelease } = pubData;
	const { communityData, scopeData } = usePageContext();
	const { submissionState } = usePubContext();
	const isUnsubmitted = submissionState?.submission.status === 'incomplete';
	const { canManage } = scopeData.activePermissions;
	const canModify = canManage && !isRelease && !isUnsubmitted;
	const publishedDate = getPubPublishedDate(pubData);

	const renderBylineEditor = () => {
		if (!canModify) {
			return null;
		}
		return (
			<>
				&nbsp;
				<DialogLauncher
					renderLauncherElement={({ openDialog }) => (
						<BylineEditButton onClick={openDialog} />
					)}
				>
					{({ isOpen, onClose }) => (
						<PubAttributionDialog
							canEdit={true}
							isOpen={isOpen}
							onClose={onClose}
							pubData={pubData}
							communityData={communityData}
							updatePubData={updatePubData}
						/>
					)}
				</DialogLauncher>
			</>
		);
	};

	const renderBylineEmptyState = () => {
		if (canModify) {
			return <span className="pub-header-themed-secondary">Edit byline</span>;
		}
		return null;
	};

	return (
		<div className="title-group-component">
			<EditableHeaderText
				text={title}
				updateText={(text) => updatePubData({ title: text })}
				canEdit={canModify}
				className="title"
				placeholder="Add a Pub title"
			/>
			{(canModify || description) && (
				<EditableHeaderText
					text={description}
					updateText={(text) => updatePubData({ description: text })}
					canEdit={canModify}
					tagName="h3"
					className="description pub-header-themed-secondary"
					placeholder="Add a description for this Pub"
					maxLength={280}
				/>
			)}
			<PubByline
				pubData={pubData as any}
				renderSuffix={() => !isRelease && renderBylineEditor()}
				renderEmptyState={renderBylineEmptyState}
			/>
			{publishedDate && (
				<div className="published-date">
					<span className="pub-header-themed-secondary">Published on</span>
					<span>{formatDate(publishedDate)}</span>
				</div>
			)}
		</div>
	);
};
export default TitleGroup;
