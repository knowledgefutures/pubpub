import React, { useState, useContext } from 'react';
import classNames from 'classnames';
import { Button } from '@blueprintjs/core';

import { pubDataProps } from 'types/pub';
import ensureUserForAttribution from 'shared/utils/ensureUserForAttribution';
import { Icon, GridWrapper } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import ClickToCopyButton from 'components/ClickToCopyButton/ClickToCopyButton';

import CompactContributors from './CompactContributors';
import Contributors from './Contributors';
import CitationsPreview from './CitationsPreview';

require('./pubDetails.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
};

const PubDetails = (props) => {
	const { pubData } = props;
	const contributorsWithUser = pubData.attributions.map(ensureUserForAttribution);
	const [isExpanded, setIsExpanded] = useState(false);
	const { communityData } = useContext(PageContext);

	const showSecondColumn = !!(pubData.doi || isExpanded);

	if (!contributorsWithUser.length && !pubData.doi) {
		return null;
	}

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
					<h6>Contributors ({contributorsWithUser.length})</h6>
					{!isExpanded && <CompactContributors contributors={contributorsWithUser} />}
					{isExpanded && <Contributors contributors={contributorsWithUser} />}
				</div>
				{showSecondColumn && (
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
			</div>
		</GridWrapper>
	);
};

PubDetails.propTypes = propTypes;
export default PubDetails;
