import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import { Menu, MenuItem, NonIdealState, Tag } from '@blueprintjs/core';

import { usePageContext } from 'utils/hooks';
import { getPubPublishedDate, getPubLatestReleaseDate } from 'utils/pub/pubDates';
import { formatDate } from 'utils/dates';
import PubHeaderBackground from 'containers/Pub/PubHeader/PubHeaderBackground';
import CitationsPreview from 'containers/Pub/PubHeader/CitationsPreview';
import { Avatar, DashboardFrame } from 'components';

import PubTimeline from './PubTimeline';

require('./pubOverview.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
};

const PubOverview = (props) => {
	const { pubData } = props;
	const { communityData } = usePageContext();
	const { title, description } = pubData;

	const renderSection = (sectionTitle, sectionText) => {
		return (
			<div className="section">
				<div className="section-header">{sectionTitle}</div>
				{sectionText}
			</div>
		);
	};

	const renderPubDates = () => {
		const publishedDate = getPubPublishedDate(pubData);
		const latestReleaseDate = getPubLatestReleaseDate(pubData, { excludeFirstRelease: true });
		const publishedOnString = publishedDate ? formatDate(publishedDate) : <i>Unpublished</i>;
		return (
			<div className="pub-dates">
				{renderSection('Created on', formatDate(pubData.createdAt))}
				{renderSection('Published on', publishedOnString)}
				{latestReleaseDate &&
					renderSection('Last released on', formatDate(latestReleaseDate))}
			</div>
		);
	};

	const renderCollections = () => {
		const { collectionPubs } = pubData;
		if (collectionPubs.length === 0) {
			return null;
		}
		return (
			<div className="collections section">
				<div className="section-header">
					Appears in collections ({collectionPubs.length})
				</div>
				{pubData.collectionPubs.map((cp, index) => {
					return (
						<span key={cp.id}>
							<a href={`/dash/collection/${cp.collection.slug}`}>
								{cp.collection.title}
							</a>
							{index !== pubData.collectionPubs.length - 1 && <span>, </span>}
						</span>
					);
				})}
			</div>
		);
	};

	const renderReviews = () => {
		return (
			<div className="section list">
				<div className="section-header">Reviews</div>
				<Menu className="list-content">
					{!pubData.reviews.length && (
						<NonIdealState title="No Reviews Yet" icon="social-media" />
					)}
					{pubData.reviews
						.sort((a, b) => a.createdAt - b.createdAt)
						.map((review) => {
							return (
								<MenuItem
									key={review.id}
									href={`/dash/pub/${pubData.slug}/reviews/${review.number}`}
									text={
										<div className="list-row">
											<div className="number">
												R{review.number}: {review.title}
											</div>
											<div className="title">
												{dateFormat(
													review.createdAt,
													'mmm dd, yyyy - HH:MM',
												)}
											</div>
											<div className="note">
												<Tag minimal className={review.status}>
													{review.status}
												</Tag>
											</div>
										</div>
									}
								/>
							);
						})}
				</Menu>
			</div>
		);
	};

	const renderAttribution = () => {
		return (
			<div className="section">
				<div className="section-header">Attribution</div>
				{!pubData.attributions.length && (
					<NonIdealState title="No attributions on this pub" icon="person" />
				)}
				{pubData.attributions
					.sort((a, b) => a.order - b.order)
					.map((attribution) => {
						const { affiliation } = attribution;
						const { initials, fullName, avatar, slug } = attribution.user;
						const roles = attribution.roles || [];
						return (
							<div className="attribution-row">
								<Avatar width={25} initials={initials} avatar={avatar} />
								<div className="details">
									<div className="name">
										<a href={`/user/${slug}`}>{fullName}</a>
									</div>
									{affiliation && (
										<div className="affiliation">{affiliation}</div>
									)}
									{roles.length > 0 && (
										<div className="roles">
											{roles.map((role) => {
												return (
													<Tag className="role" minimal>
														{role}
													</Tag>
												);
											})}
										</div>
									)}
								</div>
							</div>
						);
					})}
			</div>
		);
	};

	return (
		<DashboardFrame className="pub-overview-component" title="Overview">
			<PubHeaderBackground
				className="pub-header-component"
				pubData={pubData}
				communityData={communityData}
				safetyLayer="full-height"
			>
				<div className="header-content">
					<h1 className="title">{title}</h1>
					{description && <div className="description">{description}</div>}
					{renderPubDates()}
				</div>
			</PubHeaderBackground>
			<div className="columns">
				<div className="column">
					{renderSection(
						'Cite As',
						<CitationsPreview pubData={pubData} showHeader={false} />,
					)}
					{pubData.doi && renderSection('DOI', pubData.doi)}
					{renderAttribution()}
					{renderCollections()}
					{renderReviews()}
				</div>
				<div className="column">
					<PubTimeline pubData={pubData} />
				</div>
			</div>
		</DashboardFrame>
	);
};

PubOverview.propTypes = propTypes;
export default PubOverview;
