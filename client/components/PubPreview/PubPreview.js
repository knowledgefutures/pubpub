import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';

import { getResizedUrl, generatePubBackground } from 'utils';
import { getPubPublishedDate } from 'shared/pub/pubDates';
import { isPubPublic } from 'shared/pub/permissions';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { Avatar, Icon } from 'components';

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
};

const defaultProps = {
	communityData: undefined,
	size: 'large',
	hideByline: false,
	hideDescription: false,
	hideDates: false,
	hideContributors: false,
};

const PubPreview = function(props) {
	const { pubData, size } = props;
	const { communityData: localCommunityData } = useContext(PageContext);
	const resizedBannerImage = getResizedUrl(pubData.avatar, 'fit-in', '800x0');
	const bannerStyle =
		pubData.avatar || !pubData.slug
			? { backgroundImage: `url("${resizedBannerImage}")` }
			: { background: generatePubBackground(pubData.title) };
	const resizedHeaderLogo =
		props.communityData && getResizedUrl(props.communityData.headerLogo, 'fit-in', '125x35');
	const communityHostname =
		props.communityData &&
		(props.communityData.domain || `${props.communityData.subdomain}.pubpub.org`);
	const communityUrl =
		props.communityData &&
		(props.communityData.domain
			? `https://${props.communityData.domain}`
			: `https://${props.communityData.subdomain}.pubpub.org`);
	const pubLink = props.communityData
		? `https://${communityHostname}/pub/${pubData.slug}`
		: `/pub/${pubData.slug}`;
	const attributions = pubData.attributions || [];
	const authors = attributions.filter((attribution) => {
		return attribution.isAuthor;
	});

	const publishedDate = getPubPublishedDate(pubData);
	const isPrivate = !isPubPublic(pubData);

	const showBannerImage = ['large', 'medium'].includes(size);
	const showUpperByline = !!authors.length && !props.hideByline && ['minimal'].includes(size);
	const showLowerByline =
		!!authors.length && !props.hideByline && ['large', 'medium', 'small'].includes(size);
	const showDates = !props.hideDates && ['large', 'medium', 'small'].includes(size);
	const showContributors = !props.hideContributors && ['large', 'medium', 'small'].includes(size);
	const showDescription = pubData.description && !props.hideDescription;
	return (
		<div className={`pub-preview-component ${size}-preview`}>
			{showBannerImage && (
				<a href={pubLink} alt={pubData.title}>
					<div className="banner-image" style={bannerStyle} />
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
							href={communityUrl}
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

				{showDates && (
					<div className="date-details">
						{publishedDate && (
							<span className="date">
								Published: {dateFormat(publishedDate, 'mmm dd, yyyy')}
							</span>
						)}
					</div>
				)}

				{showContributors && (
					<div className="date-details">
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
										userInitials={collaborator.user.initials}
										userAvatar={collaborator.user.avatar}
										borderColor="rgba(255, 255, 255, 1.0)"
										width={20}
										doesOverlap={true}
									/>
								);
							})}
					</div>
				)}

				{showDescription && <div className="description">{pubData.description}</div>}
			</div>
			{/*
				TODO: Stick in a component that renders special commentary pieces
				for certain hard-coded pubs
			*/}
		</div>
	);
};

PubPreview.defaultProps = defaultProps;
PubPreview.propTypes = propTypes;
export default PubPreview;
