import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';

import { pubDataProps } from 'types/pub';
import { collectionUrl } from 'shared/utils/canonicalUrls';
import { getPubPublishedDate, getPubUpdatedDate } from 'shared/pub/pubDates';
import { ClickToCopyButton } from 'components';
import { getAllPubContributors } from 'utils/pubContributors';

import CitationsPreview from '../CitationsPreview';
import Contributors from './Contributors';

require('./pubDetails.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
	communityData: PropTypes.shape({}).isRequired,
};

const PubDetails = (props) => {
	const { pubData, communityData } = props;
	const { collectionPubs } = pubData;
	const contributors = getAllPubContributors(pubData);

	if (!contributors.length && !pubData.doi) {
		return null;
	}

	const publishedAt = getPubPublishedDate(pubData, pubData.activeBranch);
	const publishedAtString = dateFormat(publishedAt, 'mmm dd, yyyy');
	const updatedAt = getPubUpdatedDate({ pub: pubData, branch: pubData.activeBranch });
	const updatedAtString = dateFormat(updatedAt, 'mmm dd, yyyy');
	const shouldShowUpdatedDate = updatedAt && updatedAt !== publishedAt;

	return (
		<div className="pub-details-component">
			<div className="section contributors">
				<h6 className="pub-header-themed-secondary">
					Contributors ({contributors.length})
				</h6>
				<Contributors contributors={contributors} />
			</div>
			<div className="section publication-dates">
				<h6 className="pub-header-themed-secondary">
					{pubData.activeBranch.title === 'public' ? 'Published' : 'Created'}
				</h6>
				<div className="full-height-date">{publishedAtString}</div>
				{shouldShowUpdatedDate && (
					<React.Fragment>
						<h6 className="pub-header-themed-secondary">Updated</h6>
						<div className="full-height-date">{updatedAtString}</div>
					</React.Fragment>
				)}
			</div>
			<div className="section citation-and-doi">
				{pubData.doi && (
					<React.Fragment>
						<h6 className="pub-header-themed-secondary">DOI</h6>{' '}
						<ClickToCopyButton
							copyString={`https://doi.org/${pubData.doi}`}
							className="click-to-copy"
							beforeCopyPrompt="Copy doi.org link"
						>
							{pubData.doi}
						</ClickToCopyButton>
					</React.Fragment>
				)}
				<CitationsPreview pubData={pubData} />
			</div>
			<div className="section collections">
				<h6 className="pub-header-themed-secondary">
					Appears in collections ({collectionPubs.length})
				</h6>
				<div className="collection-list">
					{collectionPubs.length === 0 && (
						<i className="collection-list-entry">
							This pub doesn't belong to any collections.
						</i>
					)}
					{collectionPubs.map((collectionPub) => {
						const { collection } = collectionPub;
						if (collection) {
							return (
								<a
									className="collection-list-entry underline-on-hover"
									href={collectionUrl(communityData, collection)}
								>
									{collection.title}
								</a>
							);
						}
						return null;
					})}
				</div>
			</div>
		</div>
	);
};

PubDetails.propTypes = propTypes;
export default PubDetails;
