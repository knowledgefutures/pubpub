import React from 'react';
import PropTypes from 'prop-types';

import Byline from './Byline';
import CollectionsBar from './CollectionsBar';
import EditableHeaderText from './EditableHeaderText';
import SmallHeaderButton from './SmallHeaderButton';

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
				<div className="left">
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
				<div className="right">
					<SmallHeaderButton label="Pub settings" labelPosition="left" icon="cog" />
					<SmallHeaderButton label="Share with..." labelPosition="left" icon="people" />
					<SmallHeaderButton label="Download" labelPosition="left" icon="download2" />
					<SmallHeaderButton label="Cite" labelPosition="left" icon="cite" />
				</div>
			</div>
		</div>
	);
};

PubHeaderMain.propTypes = propTypes;
export default PubHeaderMain;
