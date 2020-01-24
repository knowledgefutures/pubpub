import React from 'react';
import dateFormat from 'dateformat';

import { pubDataProps } from 'types/pub';
import { getPubPublishedDate, getPubUpdatedDate } from 'shared/pub/pubDates';
import ClickToCopyButton from 'components/ClickToCopyButton/ClickToCopyButton';

import { getAllPubContributors } from 'utils/pubContributors';
import Contributors from './Contributors';
import CitationsPreview from '../PubHeader/CitationsPreview';

require('./pubDetails.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
};

const PubDetails = (props) => {
	const { pubData } = props;
	const contributors = getAllPubContributors(pubData);

	if (!contributors.length && !pubData.doi) {
		return null;
	}

	const publishedAt = getPubPublishedDate(pubData, pubData.activeBranch);
	const publishedAtString = dateFormat(publishedAt, 'mmm dd, yyyy');
	const updatedAt = getPubUpdatedDate(pubData, pubData.activeBranch);
	const updatedAtString = dateFormat(updatedAt, 'mmm dd, yyyy');
	const shouldShowUpdatedDate = updatedAt && updatedAt !== publishedAt;

	return (
		<div className="pub-details-component">
			<div className="section contributors">
				<h6>Contributors ({contributors.length})</h6>
				<Contributors contributors={contributors} />
			</div>
			<div className="section publication-dates">
				<h6>{pubData.activeBranch.title === 'public' ? 'Published' : 'Created'}</h6>
				<div className="full-height-date">{publishedAtString}</div>
				{shouldShowUpdatedDate && (
					<React.Fragment>
						<h6>Updated</h6>
						<div className="full-height-date">{updatedAtString}</div>
					</React.Fragment>
				)}
			</div>
			<div className="section citation-and-doi">
				{pubData.doi && (
					<React.Fragment>
						<h6>DOI</h6>{' '}
						<span className="doi-and-button">
							{pubData.doi}
							<ClickToCopyButton
								copyString={`https://doi.org/${pubData.doi}`}
								className="click-to-copy"
								beforeCopyPrompt="Copy doi.org link"
							/>
						</span>
					</React.Fragment>
				)}
				<CitationsPreview pubData={pubData} />
			</div>
			<div className="section spacing-placeholder" />
		</div>
	);
};

PubDetails.propTypes = propTypes;
export default PubDetails;
