import React from 'react';
import PropTypes from 'prop-types';

import { PubByline, DialogLauncher, PubAttributionDialog } from 'components';
import { usePageContext } from 'utils/hooks';
import { getPubPublishedDate } from 'utils/pub/pubDates';
import { formatDate } from 'utils/dates';

import BylineEditButton from './BylineEditButton';
import EditableHeaderText from './EditableHeaderText';

const propTypes = {
	pubData: PropTypes.shape({
		title: PropTypes.string,
		description: PropTypes.string,
		isRelease: PropTypes.bool,
	}).isRequired,
	updatePubData: PropTypes.func.isRequired,
};

const TitleGroup = (props) => {
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
				/>
			)}
			<PubByline
				pubData={pubData}
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

TitleGroup.propTypes = propTypes;
export default TitleGroup;
