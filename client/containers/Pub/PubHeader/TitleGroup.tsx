import React from 'react';

import { PubByline, DialogLauncher, PubAttributionDialog } from 'components';
import { usePageContext } from 'utils/hooks';
import { getPubPublishedDate } from 'utils/pub/pubDates';
import { formatDate } from 'utils/dates';

import BylineEditButton from './BylineEditButton';
import EditableHeaderText from './EditableHeaderText';

type Props = {
	pubData: {
		title?: string;
		description?: string;
		isRelease?: boolean;
	};
	updatePubData: (...args: any[]) => any;
};

const TitleGroup = (props: Props) => {
	const { pubData, updatePubData } = props;
	const { title, description, isRelease } = pubData;
	const { communityData, scopeData } = usePageContext();
	const { canManage } = scopeData.activePermissions;
	const canModify = canManage && !isRelease;
	const publishedDate = getPubPublishedDate(pubData);

	const renderBylineEditor = () => {
		if (!canManage) {
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
							// @ts-expect-error ts-migrate(2322) FIXME: Property 'canEdit' does not exist on type 'Intrins... Remove this comment to see the full error message
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
		if (canManage && !isRelease) {
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
