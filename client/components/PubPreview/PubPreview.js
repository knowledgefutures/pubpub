import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';

import { getResizedUrl } from 'utils/images';
import { getPubPublishedDate } from 'utils/pub/pubDates';
import { isPubPublic } from 'utils/pub/permissions';
import { pubUrl, communityUrl } from 'utils/canonicalUrls';
import { usePageContext } from 'utils/hooks';
import { Avatar, Icon, PreviewImage } from 'components';

import SubPreview from './SubPreview';
import { generateAuthorString } from './pubPreviewUtils';

require('./pubPreview.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	communityData: PropTypes.object,
	size: PropTypes.string,
	hideByline: PropTypes.bool,
	hideDescription: PropTypes.bool,
	hideDates: PropTypes.bool,
	hideContributors: PropTypes.bool,
	customPubUrl: PropTypes.string,
};

const defaultProps = {
	communityData: undefined,
	size: 'large',
	hideByline: false,
	hideDescription: false,
	hideDates: false,
	hideContributors: false,
	customPubUrl: null,
};

const PubPreview = function(props) {
	const { pubData, size, communityData, customPubUrl } = props;
	const { communityData: localCommunityData, scopeData } = usePageContext();
	const resizedHeaderLogo =
		props.communityData && getResizedUrl(props.communityData.headerLogo, 'fit-in', '125x35');
	const attributions = pubData.attributions || [];
	const authors = attributions.filter((attribution) => {
		return attribution.isAuthor;
	});

	const publishedDate = getPubPublishedDate(pubData);
	const isPrivate = !isPubPublic(pubData, scopeData);
	const showBannerImage = ['large', 'medium'].includes(size);
	const showUpperByline = !!authors.length && !props.hideByline && ['minimal'].includes(size);
	const showLowerByline =
		!!authors.length && !props.hideByline && ['large', 'medium', 'small'].includes(size);
	const showDates = !props.hideDates && ['large', 'medium', 'small'].includes(size);
	const showContributors = !props.hideContributors && ['large', 'medium', 'small'].includes(size);
	const showDescription = pubData.description && !props.hideDescription;
	const pubLink =
		customPubUrl || (communityData ? pubUrl(communityData, pubData) : `/pub/${pubData.slug}`);
	return (
		<div className={`pub-preview-component ${size}-preview`}>
			{showBannerImage && (
				<a href={pubLink} alt={pubData.title}>
					<PreviewImage
						src={pubData.avatar}
						title={pubData.title}
						className="banner-image"
					/>
				</a>
			)}
			<div className="content">
				{showUpperByline && (
					<div className="authors" style={{ color: localCommunityData.accentColorDark }}>
						{generateAuthorString(pubData)}
					</div>
				)}
				<div className="title-wrapper">
					{props.communityData && (
						<a
							href={communityUrl(communityData)}
							alt={props.communityData.title}
							className="community-banner"
							style={{ backgroundColor: props.communityData.accentColorDark }}
						>
							<img
								alt={`${props.communityData.title} logo`}
								src={resizedHeaderLogo}
							/>
						</a>
					)}
					<a href={pubLink} alt={pubData.title}>
						<h3 className="pub-title">
							{pubData.title}
							{isPrivate && <Icon icon="lock2" />}
						</h3>
					</a>
				</div>

				{showLowerByline && (
					<div className="authors">
						<span>by </span>
						{generateAuthorString(pubData)}
					</div>
				)}

				{showContributors && (
					<div className="author-avatars">
						{attributions
							.sort((foo, bar) => {
								if (foo.order < bar.order) {
									return -1;
								}
								if (foo.order > bar.order) {
									return 1;
								}
								if (foo.createdAt < bar.createdAt) {
									return 1;
								}
								if (foo.createdAt > bar.createdAt) {
									return -1;
								}
								return 0;
							})
							.map((collaborator, index) => {
								return (
									<Avatar
										key={`avatar-${collaborator.id}`}
										instanceNumber={index}
										initials={collaborator.user.initials}
										avatar={collaborator.user.avatar}
										borderColor="rgba(255, 255, 255, 1.0)"
										width={20}
										doesOverlap={true}
									/>
								);
							})}
					</div>
				)}

				{showDates && (
					<div className="date-details">
						{publishedDate ? (
							<span className="date">
								Published: {dateFormat(publishedDate, 'mmm dd, yyyy')}
							</span>
						) : (
							<span className="date">Unpublished</span>
						)}
					</div>
				)}

				{showDescription && <div className="description">{pubData.description}</div>}
			</div>
			<SubPreview pubData={pubData} size={size} />
		</div>
	);
};

PubPreview.defaultProps = defaultProps;
PubPreview.propTypes = propTypes;
export default PubPreview;
