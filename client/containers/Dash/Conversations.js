import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, InputGroup } from '@blueprintjs/core';
import TimeAgo from 'react-timeago';
import fuzzysearch from 'fuzzysearch';
import { nestDiscussionsToThreads } from 'containers/Pub/PubDocument/PubDiscussions/discussionUtils';
import { Icon } from 'components';
import { getDashUrl, getActiveDiscussions } from './utils';

require('./conversations.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	// loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
};

const Conversations = (props) => {
	const { communityData, locationData } = props;
	const [filterText, setFilterText] = useState('');
	const discussions = getActiveDiscussions(communityData, locationData);
	const threads = nestDiscussionsToThreads(discussions);
	const collectionSlug = locationData.params.collectionSlug || locationData.query.collectionSlug;
	const pubSlug = locationData.params.pubSlug;
	const filteredThreads = threads.filter((thread) => {
		const toTest = filterText.toLowerCase();
		const titleMatch = thread[0].title && fuzzysearch(toTest, thread[0].title.toLowerCase());
		const authorMatch =
			thread[0].author.fullName &&
			fuzzysearch(toTest, thread[0].author.fullName.toLowerCase());
		const pubMatch =
			thread[0].pub.title && fuzzysearch(toTest, thread[0].pub.title.toLowerCase());
		return titleMatch || authorMatch || pubMatch;
	});
	return (
		<div className="conversations-component">
			<div className="title-bar">
				<div className="title">Conversations</div>
				<div className="filter">
					<InputGroup
						placeholder="Filter Discussions"
						value={filterText}
						onChange={(evt) => {
							setFilterText(evt.target.value);
						}}
					/>
				</div>
				<div className="buttons">
					<Button text="New Discussion" />
				</div>
			</div>

			{filteredThreads.map((thread) => {
				const topRankedCollectionPub = thread[0].pub.collectionPubs.reduce((prev, curr) => {
					if (!prev.rank) {
						return curr;
					}
					if (curr.rank < prev.rank) {
						return curr;
					}
					return prev;
				}, {});
				const primaryCollectionPub = thread[0].pub.collectionPubs.find(
					(collectionPub) => collectionPub.isPrimary,
				);
				const collectionPub = primaryCollectionPub || topRankedCollectionPub;
				const activeCollection =
					communityData.collections.find((collection) => {
						return collection.id === collectionPub.collectionId;
					}) || {};
				const collectionPubSlug = activeCollection
					? activeCollection.title.toLowerCase().replace(/ /gi, '-')
					: undefined;
				return (
					<div className="thread-row" key={thread[0].id}>
						<div className="top">
							<div className="thread-title">
								<a
									href={getDashUrl({
										collectionSlug: collectionSlug || collectionPubSlug,
										pubSlug: thread[0].pub.slug,
										mode: 'conversations',
										submode: String(thread[0].threadNumber),
									})}
								>
									{thread[0].title || '(Untitled)'}
								</a>
							</div>
							<div className="reply-count">
								<Icon icon="chat2" iconSize={14} />
								{thread.length}
							</div>
						</div>
						<div className="bottom">
							<div className="left">
								#{thread[0].threadNumber}
								{!pubSlug && (
									<span>
										{' '}
										[
										<a
											href={getDashUrl({
												collectionSlug: collectionSlug,
												pubSlug: thread[0].pub.slug,
											})}
										>
											{thread[0].pub.title}
										</a>
										]
									</span>
								)}
							</div>
							<div className="right">
								Opened{' '}
								<TimeAgo
									formatter={(value, unit, suffix) => {
										const unitSuffix = value === 1 ? '' : 's';
										return `${value} ${unit}${unitSuffix} ${suffix}`;
									}}
									date={thread[0].createdAt}
								/>{' '}
								by {thread[0].author.fullName}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};

Conversations.propTypes = propTypes;
export default Conversations;
