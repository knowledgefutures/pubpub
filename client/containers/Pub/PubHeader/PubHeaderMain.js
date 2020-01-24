import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import { usePopoverState, PopoverDisclosure, Popover } from 'reakit';
import { Card } from '@blueprintjs/core';

import { ClickToCopyButton } from 'components';
import { getPubPublishedDate } from 'shared/pub/pubDates';

import Byline from './Byline';
import CitationsPreview from './CitationsPreview';
import CollectionsBar from './collections/CollectionsBar';
import Download from './Download';
import EditableHeaderText from './EditableHeaderText';
import SmallHeaderButton from './SmallHeaderButton';
import ThemePicker from './ThemePicker';

const propTypes = {
	pubData: PropTypes.shape({
		title: PropTypes.string.isRequired,
		description: PropTypes.string,
		canManage: PropTypes.bool.isRequired,
		doi: PropTypes.string,
	}).isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const PopoverButton = (props) => {
	const { component: Component, 'aria-label': ariaLabel, children, ...restProps } = props;
	const popover = usePopoverState({ unstable_fixed: true, placement: 'bottom-end', gutter: 5 });
	return (
		<>
			<PopoverDisclosure {...popover} {...children.props}>
				{(disclosureProps) => {
					return React.cloneElement(children, disclosureProps);
				}}
			</PopoverDisclosure>
			<Popover
				className="pub-header-popover"
				unstable_portal={true}
				tabIndex={0}
				{...popover}
			>
				<Card elevation={2}>
					<Component {...restProps} />
				</Card>
			</Popover>
		</>
	);
};

const getPublishDateString = (pubData) => {
	const publishedDate = getPubPublishedDate(
		pubData,
		pubData.branches.find((br) => br.title === 'public'),
	);
	if (publishedDate) {
		dateFormat(publishedDate, 'mmm dd, yyyy');
	}
	return <i>Unpublished</i>;
};

const PubHeaderMain = (props) => {
	const { pubData, updateLocalData, communityData } = props;
	const { canManage, title, description, doi } = pubData;
	const publishedAtString = getPublishDateString(pubData);
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
					<div className="show-details-placeholder" />
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
					<Download pubData={pubData}>
						<SmallHeaderButton label="Download" labelPosition="left" icon="download2" />
					</Download>
					<PopoverButton
						component={CitationsPreview}
						pubData={pubData}
						aria-label="Cite this Pub"
					>
						<SmallHeaderButton label="Cite" labelPosition="left" icon="cite" />
					</PopoverButton>
					{canManage && (
						<PopoverButton
							component={ThemePicker}
							updateLocalData={updateLocalData}
							pubData={pubData}
							communityData={communityData}
							aria-label="Pub header theme options"
						>
							<SmallHeaderButton
								label="Edit theme"
								labelPosition="left"
								icon="clean"
							/>
						</PopoverButton>
					)}
				</div>
			</div>
		</div>
	);
};

PubHeaderMain.propTypes = propTypes;
export default PubHeaderMain;
