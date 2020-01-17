import React from 'react';
import PropTypes from 'prop-types';

import CollectionsBar from './CollectionsBar';
import EditableHeaderText from './EditableHeaderText';
import Byline from './Byline';

const propTypes = {
	pubData: PropTypes.shape({
		title: PropTypes.string.isRequired,
		description: PropTypes.string,
		canManage: PropTypes.bool.isRequired,
	}).isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const PubHeaderMain = (props) => {
	const { pubData, updateLocalData } = props;
	const { canManage, title, description } = pubData;
	return (
		<div className="pub-header-main">
			<div className="top">
				<CollectionsBar pubData={pubData} updateLocalData={updateLocalData} />
			</div>
			<div className="middle">
				<EditableHeaderText
					text={title}
					updateText={(text) => updateLocalData('pub', { title: text })}
					canEdit={canManage}
					className="title"
					placeholder="Add a Pub title"
				/>
				{(canManage || description) && (
					<EditableHeaderText
						text={description}
						updateText={(text) => updateLocalData('pub', { description: text })}
						canEdit={canManage}
						tagName="h3"
						className="description"
						placeholder="Add a description for this Pub"
					/>
				)}
				<Byline pubData={pubData} />
			</div>
		</div>
	);
};

PubHeaderMain.propTypes = propTypes;
export default PubHeaderMain;
