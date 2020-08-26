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
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'never'... Remove this comment to see the full error message
				text={title}
				// @ts-expect-error ts-migrate(2322) FIXME: Type '(text: any) => any' is not assignable to typ... Remove this comment to see the full error message
				updateText={(text) => updatePubData({ title: text })}
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
				canEdit={canModify}
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				className="title"
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				placeholder="Add a Pub title"
			/>
			{(canModify || description) && (
				<EditableHeaderText
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'never'... Remove this comment to see the full error message
					text={description}
					// @ts-expect-error ts-migrate(2322) FIXME: Type '(text: any) => any' is not assignable to typ... Remove this comment to see the full error message
					updateText={(text) => updatePubData({ description: text })}
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
					canEdit={canModify}
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
					tagName="h3"
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
					className="description pub-header-themed-secondary"
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
					placeholder="Add a description for this Pub"
					maxLength={280}
				/>
			)}
			<PubByline
				pubData={pubData}
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'false' is not assignable to type 'null'.
				renderSuffix={() => !isRelease && renderBylineEditor()}
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'null'.
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
