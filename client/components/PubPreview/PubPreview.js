import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';

import { getResizedUrl, generatePubBackground } from 'utils';
import { getPubPublishedDate } from 'shared/pub/pubDates';
import { isPubPublic } from 'shared/pub/permissions';
import Avatar from 'components/Avatar/Avatar';
import Icon from 'components/Icon/Icon';

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
	const pubData = props.pubData;

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

	return (
		<div className={`pub-preview-component ${props.size}-preview`}>
			{props.size !== 'small' && (
				<a href={pubLink} alt={pubData.title}>
					<div className="banner-image" style={bannerStyle} />
				</a>
			)}
			<div className="content">
				<div className="title-wrapper">
					{props.communityData && (
						<a
							href={communityUrl}
							alt={props.communityData.title}
							className="community-banner"
							style={{ backgroundColor: props.communityData.accentColor }}
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

				{!!authors.length && !props.hideByline && (
					<div className="authors">
						<span>by </span>
						{authors
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
							.map((author, index) => {
								const separator =
									index === authors.length - 1 || authors.length === 2
										? ''
										: ', ';
								const prefix =
									index === authors.length - 1 && index !== 0 ? ' and ' : '';
								if (author.user.slug) {
									return (
										<span key={`author-${author.id}`}>
											{prefix}
											<a href={`/user/${author.user.slug}`}>
												{author.user.fullName}
											</a>
											{separator}
										</span>
									);
								}
								return (
									<span key={`author-${author.id}`}>
										{prefix}
										{author.user.fullName}
										{separator}
									</span>
								);
							})}
					</div>
				)}

				{!props.hideDates && (
					<div className="date-details">
						{publishedDate && (
							<span className="date">
								Published: {dateFormat(publishedDate, 'mmm dd, yyyy')}
							</span>
						)}
					</div>
				)}

				{!props.hideContributors && (
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

				{pubData.description && !props.hideDescription && (
					<div className="description">{pubData.description}</div>
				)}
			</div>
		</div>
	);
};

PubPreview.defaultProps = defaultProps;
PubPreview.propTypes = propTypes;
export default PubPreview;
