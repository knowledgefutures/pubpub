import React from 'react';
import dateFormat from 'dateformat';
import { Menu, MenuItem, NonIdealState, Tag } from '@blueprintjs/core';

import { usePageContext } from 'utils/hooks';
import { getPubPublishedDate, getPubLatestReleaseDate } from 'utils/pub/pubDates';
import { formatDate } from 'utils/dates';
import PubHeaderBackground from 'containers/Pub/PubHeader/PubHeaderBackground';
import CitationsPreview from 'containers/Pub/PubHeader/CitationsPreview';
import { Avatar, ContributorsList, DashboardFrame } from 'components';

import { getAllPubContributors } from 'utils/contributors';
import PubTimeline from './PubTimeline';

require('./pubOverview.scss');

type Props = {
	pubData: any;
};

const PubOverview = (props: Props) => {
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
					Appears in Collections ({collectionPubs.length})
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

	const renderContributors = () => {
		return (
			<div className="section">
				<div className="section-header">Contributors</div>
				<ContributorsList attributions={getAllPubContributors(pubData)} />
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
					{renderContributors()}
					{renderCollections()}
					{!!pubData.reviews.length && renderReviews()}
				</div>
				<div className="column">
					<PubTimeline pubData={pubData} />
				</div>
			</div>
		</DashboardFrame>
	);
};
export default PubOverview;
