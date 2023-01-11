import React from 'react';
import dateFormat from 'dateformat';
import { Menu, MenuItem, Tag } from '@blueprintjs/core';

import { Review, SanitizedPubData } from 'types';
import { ContributorsList, DashboardFrame, PubHeaderBackground, PubTitle } from 'components';
import CitationsPreview from 'containers/Pub/PubHeader/CitationsPreview';
import { useFacetsQuery } from 'client/utils/useFacets';
import { formatDate } from 'utils/dates';
import { getAllPubContributors } from 'utils/contributors';
import { getDashUrl } from 'utils/dashboard';
import { getPubPublishedDateString, getPubLatestReleaseDate } from 'utils/pub/pubDates';
import { usePageContext } from 'utils/hooks';

import PubTimeline from './PubTimeline';

require('./pubOverview.scss');

type Props = {
	pubData: SanitizedPubData;
};

const PubOverview = (props: Props) => {
	const { pubData } = props;
	const { communityData, featureFlags } = usePageContext();
	const { description, htmlDescription } = pubData;

	const pubHeaderTheme = useFacetsQuery((F) => F.PubHeaderTheme);

	const renderSection = (sectionTitle, sectionText) => {
		return (
			<div className="section">
				<div className="section-header">{sectionTitle}</div>
				{sectionText}
			</div>
		);
	};

	const renderPubDates = () => {
		const publishedDateString = getPubPublishedDateString(pubData);
		const latestReleaseDate = getPubLatestReleaseDate(pubData, { excludeFirstRelease: true });
		return (
			<div className="pub-dates">
				{renderSection('Created on', formatDate(pubData.createdAt))}
				{renderSection('Published on', publishedDateString || <i>Unpublished</i>)}
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
							<a href={getDashUrl({ collectionSlug: cp.collection!.slug })}>
								{cp.collection!.title}
							</a>
							{index !== pubData.collectionPubs.length - 1 && <span>, </span>}
						</span>
					);
				})}
			</div>
		);
	};

	const renderReviews = (reviews: Review[]) => {
		return (
			<div className="section list">
				<div className="section-header">Reviews</div>
				<Menu className="list-content">
					{reviews
						.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
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
				<ContributorsList attributions={getAllPubContributors(pubData, 'contributors')} />
			</div>
		);
	};

	return (
		<DashboardFrame className="pub-overview-component" title="Overview">
			<PubHeaderBackground
				pubHeaderTheme={pubHeaderTheme}
				className="pub-header-component"
				communityData={communityData}
				safetyLayer="full-height"
			>
				<div className="header-content">
					<h1 className="title">
						<PubTitle pubData={pubData} />
					</h1>
					{description && (
						<div className="description">
							{featureFlags.htmlPubHeaderValues ? (
								<span
									// eslint-disable-next-line react/no-danger
									dangerouslySetInnerHTML={{
										__html: htmlDescription ?? description ?? '',
									}}
								/>
							) : (
								description
							)}
						</div>
					)}
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
					{!!pubData.reviews?.length && renderReviews(pubData.reviews)}
				</div>
				<div className="column">
					<PubTimeline pubData={pubData} />
				</div>
			</div>
		</DashboardFrame>
	);
};
export default PubOverview;
