import React, { useCallback } from 'react';

import { PubByline, DialogLauncher, PubAttributionDialog, TitleEditor } from 'components';
import { usePageContext } from 'utils/hooks';
import { getPubPublishedDateString } from 'utils/pub/pubDates';
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
	const { title, htmlTitle, description, htmlDescription, isRelease } = pubData;
	const { communityData, scopeData, featureFlags } = usePageContext();
	const { submissionState } = usePubContext();
	const isUnsubmitted = submissionState?.submission.status === 'incomplete';
	const { canManage } = scopeData.activePermissions;
	const canModify = canManage && !isRelease && !isUnsubmitted;
	const publishedDateString = getPubPublishedDateString(pubData);

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
			return <span className="pub-header-themed-secondary">Edit Pub contributors</span>;
		}
		return null;
	};

	const onTitleEditorChange = useCallback(
		(nextHtmlTitle: string, nextTitle: string) => {
			document.title = nextTitle;
			updatePubData({ title: nextTitle, htmlTitle: nextHtmlTitle });
		},
		[updatePubData],
	);

	const onDescritptionEditorChange = useCallback(
		(nextHtmlDescription: string, nextDescription: string) => {
			updatePubData({ description: nextDescription, htmlDescription: nextHtmlDescription });
		},
		[updatePubData],
	);

	return (
		<div className="title-group-component">
			{featureFlags.htmlPubHeaderValues ? (
				<h1 className="title">
					<TitleEditor
						initialValue={htmlTitle ?? title}
						isReadOnly={!canModify}
						onChange={onTitleEditorChange}
						placeholder="Add a Pub title"
					/>
				</h1>
			) : (
				<EditableHeaderText
					text={title}
					updateText={(text) => updatePubData({ title: text })}
					canEdit={canModify}
					className="title"
					placeholder="Add a Pub title"
				/>
			)}
			{(canModify || description) &&
				(featureFlags.htmlPubHeaderValues ? (
					<TitleEditor
						initialValue={htmlDescription ?? description}
						isReadOnly={!canModify}
						onChange={onDescritptionEditorChange}
						placeholder="Add a description for this Pub"
						maxLength={280}
					/>
				) : (
					<EditableHeaderText
						text={description}
						updateText={(text) => updatePubData({ description: text })}
						canEdit={canModify}
						tagName="p"
						className="description pub-header-themed-secondary"
						placeholder="Add a description for this Pub"
						maxLength={280}
					/>
				))}
			<PubByline
				pubData={pubData as any}
				renderSuffix={() => !isRelease && renderBylineEditor()}
				renderEmptyState={renderBylineEmptyState}
			/>
			{publishedDateString && (
				<div className="published-date">
					<span className="pub-header-themed-secondary">Published on</span>
					<span>{publishedDateString}</span>
				</div>
			)}
		</div>
	);
};
export default TitleGroup;
