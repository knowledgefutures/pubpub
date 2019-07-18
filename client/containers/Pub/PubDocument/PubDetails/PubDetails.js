import React, { useState, useContext } from 'react';
import classNames from 'classnames';
import dateFormat from 'dateformat';
import { Button } from '@blueprintjs/core';

import { pubDataProps } from 'types/pub';
import { getPubPublishedDate, getPubUpdatedDate } from 'shared/pub/pubDates';
import { Icon, GridWrapper } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import ClickToCopyButton from 'components/ClickToCopyButton/ClickToCopyButton';

import { getAllPubContributors } from 'utils/pubContributors';
import CompactContributors from './CompactContributors';
import Contributors from './Contributors';
import CitationsPreview from './CitationsPreview';

require('./pubDetails.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
};

const PubDetails = (props) => {
	const { pubData } = props;
	const contributors = getAllPubContributors(pubData);
	const [isExpanded, setIsExpanded] = useState(false);
	const { communityData } = useContext(PageContext);

	const showThirdColumn = !!(pubData.doi || isExpanded);

	if (!contributors.length && !pubData.doi) {
		return null;
	}

	const publishedAt = getPubPublishedDate(pubData, pubData.activeBranch);
	const publishedAtString = dateFormat(publishedAt, 'mmm dd, yyyy');
	const updatedAt = getPubUpdatedDate(pubData, pubData.activeBranch);
	const updatedAtString = dateFormat(updatedAt, 'mmm dd, yyyy');
	const shouldShowUpdatedDate = updatedAt && updatedAt !== publishedAt;

	return (
		<GridWrapper containerClassName="pub">
			<div className={classNames('pub-details-component', isExpanded && 'expanded')}>
				<div className="expand-contract">
					<Button
						minimal
						rightIcon={
							<Icon
								className="expand-icon"
								icon={isExpanded ? 'collapse-all' : 'expand-all'}
								iconSize={12}
								color={communityData.accentColorDark}
							/>
						}
						onClick={() => setIsExpanded(!isExpanded)}
						style={{ color: communityData.accentColorDark }}
						text={isExpanded ? 'Collapse Details' : 'Show All Details'}
					/>
				</div>
				<div className="section contributors">
					<h6>Contributors ({contributors.length})</h6>
					{!isExpanded && <CompactContributors contributors={contributors} />}
					{isExpanded && <Contributors contributors={contributors} />}
				</div>
				<div className="section publication-dates">
					<h6>{pubData.activeBranch.title === 'public' ? 'Published' : 'Created'}</h6>
					<div className="full-height-date">{publishedAtString}</div>
					{isExpanded && shouldShowUpdatedDate && (
						<React.Fragment>
							<h6>Updated</h6>
							<div className="full-height-date">{updatedAtString}</div>
						</React.Fragment>
					)}
				</div>
				{showThirdColumn && (
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
						{isExpanded && <CitationsPreview pubData={pubData} />}
					</div>
				)}
				<div className="section spacing-placeholder" />
			</div>
		</GridWrapper>
	);
};

PubDetails.propTypes = propTypes;
export default PubDetails;
