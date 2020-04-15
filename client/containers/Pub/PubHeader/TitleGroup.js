import React from 'react';
import PropTypes from 'prop-types';

import { Byline, DialogLauncher, PubAttributionDialog } from 'components';
import { usePageContext } from 'utils/hooks';

import BylineEditButton from './BylineEditButton';
import EditableHeaderText from './EditableHeaderText';

const propTypes = {
	pubData: PropTypes.shape({
		title: PropTypes.string,
		description: PropTypes.string,
	}).isRequired,
	updatePubData: PropTypes.func.isRequired,
};

const TitleGroup = (props) => {
	const { pubData, updatePubData } = props;
	const { title, description } = pubData;
	const { communityData, scopeData } = usePageContext();
	const { canManage } = scopeData.activePermissions;

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

	return (
		<div className="title-group-component">
			<EditableHeaderText
				text={title}
				updateText={(text) => updatePubData({ title: text })}
				canEdit={canManage}
				className="title"
				placeholder="Add a Pub title"
			/>
			{(canManage || description) && (
				<EditableHeaderText
					text={description}
					updateText={(text) => updatePubData({ description: text })}
					canEdit={canManage}
					tagName="h3"
					className="description pub-header-themed-secondary"
					placeholder="Add a description for this Pub"
				/>
			)}
			<Byline pubData={pubData} renderSuffix={renderBylineEditor} />
		</div>
	);
};

TitleGroup.propTypes = propTypes;
export default TitleGroup;
