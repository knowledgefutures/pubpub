import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import TimeAgo from 'react-timeago';
import { Menu, MenuItem, NonIdealState, Tag } from '@blueprintjs/core';

import { usePageContext } from 'utils/hooks';
import { getPubPublishedDate } from 'shared/pub/pubDates';
import PubHeaderBackground from 'containers/Pub/PubHeader/PubHeaderBackground';
import CitationsPreview from 'containers/Pub/PubHeader/CitationsPreview';
import { Avatar, DashboardFrame } from 'components';

require('./pubOverview.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
};

const PubOverview = (props) => {
	const { pubData } = props;
	const { communityData } = usePageContext();

	const renderUpdatedTime = () => {
		const { latestKeyAt: latestKeyAtSring } = pubData.activeBranch;
		const latestKeyAt = new Date(latestKeyAtSring);
		if (new Date().toDateString() === latestKeyAt.toDateString()) {
			return <TimeAgo date={latestKeyAt} minPeriod={60} />;
		}
		return dateFormat(latestKeyAtSring, 'mmm dd, yyyy');
	};
	const publishedDate = getPubPublishedDate(
		pubData,
		pubData.branches.find((br) => br.title === 'public'),
	);

	const renderBlock = (title, text) => {
		return (
			<div className="block">
				<div className="block-title">{title}</div>
				<div className="block-text">{text}</div>
			</div>
		);
	};

	return (
		<DashboardFrame className="pub-overview-component" title="Overview">
			<PubHeaderBackground
				className="pub-header-component"
				pubData={pubData}
				communityData={communityData}
				showSafetyLayer={true}
			>
				<div className="header-content">
					<h1 className="title">{pubData.title}</h1>
					<div className="edit">Edit Title</div>
					<div className="description">{pubData.description}</div>
					<div className="edit">Edit Description</div>
				</div>
			</PubHeaderBackground>
			<div className="edit">Edit Theme</div>
			<div className="blocks">
				{renderBlock('Created on', dateFormat(pubData.createdAt, 'mmm dd, yyyy'))}
				{renderBlock('Updated on', renderUpdatedTime())}
				{renderBlock(
					'Published on',
					publishedDate ? dateFormat(publishedDate, 'mmm dd, yyyy') : 'Unpublished',
				)}
				{renderBlock('DOI', pubData.doi || '-')}
			</div>
			<div className="blocks">
				{renderBlock(
					`Appears in ${pubData.collectionPubs.length} Collection${
						pubData.collectionPubs.length === 1 ? '' : 's'
					}`,
					<React.Fragment>
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
					</React.Fragment>,
				)}
				{renderBlock('Cite As', <CitationsPreview pubData={pubData} showHeader={false} />)}
			</div>
			<div className="list">
				<div className="list-title">Reviews</div>
				<Menu className="list-content">
					{!pubData.reviews.length && (
						<NonIdealState title="No Reviews Yet" icon="social-media" />
					)}
					{pubData.reviews
						.sort((foo, bar) => {
							if (foo.createdAt < bar.createdAt) {
								return 1;
							}
							if (foo.createdAt > bar.createdAt) {
								return -1;
							}
							return 0;
						})
						.map((review, index) => {
							const releaseNum = pubData.releases.length - index;
							return (
								<MenuItem
									href={`/dash/pub/${pubData.slug}/reviews/${releaseNum}`}
									text={
										<div className="list-row">
											<div className="number">R{releaseNum}</div>
											<div className="title">
												{dateFormat(
													review.createdAt,
													'mmm dd, yyyy - HH:MM',
												)}
											</div>
											<div className="note">{review.status}</div>
										</div>
									}
								/>
							);
						})}
				</Menu>
			</div>
			<div className="list">
				<div className="list-title">Releases</div>
				<Menu className="list-content">
					{!pubData.releases.length && (
						<NonIdealState
							title="This Pub is unpublished and has no Releases"
							icon="circle"
						/>
					)}
					{pubData.releases
						.sort((foo, bar) => {
							if (foo.createdAt < bar.createdAt) {
								return 1;
							}
							if (foo.createdAt > bar.createdAt) {
								return -1;
							}
							return 0;
						})
						.map((release, index) => {
							const releaseNum = pubData.releases.length - index;
							return (
								<MenuItem
									href={`/pub/${pubData.slug}/release/${releaseNum}`}
									text={
										<div className="list-row">
											<div className="number">#{releaseNum}</div>
											<div className="title">
												{dateFormat(
													release.createdAt,
													'mmm dd, yyyy - HH:MM',
												)}
											</div>
											<div className="note">{release.noteText}</div>
										</div>
									}
								/>
							);
						})}
				</Menu>
			</div>
			<div className="list">
				<div className="list-title">
					Attribution <span className="edit"> Edit Attributions</span>
				</div>
				<Menu className="list-content">
					{!pubData.attributions.length && (
						<NonIdealState title="No attributions on this pub" icon="person" />
					)}
					{pubData.attributions
						.sort((a, b) => a.order - b.order)
						.map((attribution) => {
							const { initials, fullName, avatar, slug } = attribution.user;
							return (
								<MenuItem
									className="attribution-item"
									text={
										<div className="list-row">
											<div className="number">
												<Avatar
													width={25}
													initials={initials}
													avatar={avatar}
												/>
											</div>
											<div>
												<div>
													<a href={`/user/${slug}`}>{fullName}</a>
												</div>
												<div>
													<i>{attribution.affiliation}</i>
												</div>
												<div>
													{attribution.roles.map((role) => {
														return <Tag minimal>{role}</Tag>;
													})}
												</div>
											</div>
										</div>
									}
								/>
							);
						})}
				</Menu>
			</div>
		</DashboardFrame>
	);
};

PubOverview.propTypes = propTypes;
export default PubOverview;
