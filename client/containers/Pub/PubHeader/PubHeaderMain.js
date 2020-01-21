import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';

import { ClickToCopyButton } from 'components';
import { getPubPublishedDate } from 'shared/pub/pubDates';

import Byline from './Byline';
import EditableHeaderText from './EditableHeaderText';
import SmallHeaderButton from './SmallHeaderButton';
import CollectionsBar from './collections/CollectionsBar';

const propTypes = {
	pubData: PropTypes.shape({
		title: PropTypes.string.isRequired,
		description: PropTypes.string,
		canManage: PropTypes.bool.isRequired,
		doi: PropTypes.string,
	}).isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const PubHeaderMain = (props) => {
	const { pubData, updateLocalData } = props;
	const { canManage, title, description, doi } = pubData;
	const publishedAtString = dateFormat(getPubPublishedDate(pubData), 'mmm dd, yyyy');

	return (
		<div className="pub-header-main">
			<div className="top">
				<CollectionsBar pubData={pubData} updateLocalData={updateLocalData} />
				<div className="basic-details">
					<span className="metadata-pair">
						<b>Published on</b>
						{publishedAtString}
					</span>
					{doi && (
						<span className="metadata-pair doi-pair">
							<b>DOI</b>
							<ClickToCopyButton
								copyString={`https://doi.org/${doi}`}
								className="click-to-copy"
								beforeCopyPrompt="Copy doi.org link"
								icon={null}
							>
								{doi}
							</ClickToCopyButton>
						</span>
					)}
					<SmallHeaderButton
						className="details-button"
						label="Show details"
						labelPosition="left"
						icon="expand-all"
					/>
				</div>
			</div>
			<div className="hairline" />
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
