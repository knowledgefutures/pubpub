import React, { useState, useContext, useRef } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Button, ButtonGroup } from '@blueprintjs/core';

import { pubDataProps } from 'types/pub';
import ensureUserForAttribution from 'shared/utils/ensureUserForAttribution';
import { Icon, GridWrapper } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import Avatar from 'components/Avatar/Avatar';
import ClickToCopyButton from 'components/ClickToCopyButton/ClickToCopyButton';

import Contributors from './Contributors';
import CitationsModal from './CitationsModal';

require('./pubDetails.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
};

const maxContributorsInCompactView = 5;

const PubDetails = (props) => {
	const { pubData } = props;
	const contributorsWithUser = pubData.attributions.map(ensureUserForAttribution);
	const [isExpanded, setIsExpanded] = useState(false);
	const [isCitationModalOpen, setCitationModalOpen] = useState(false);
	const copyableCitationRef = useRef();
	const {
		communityData: { accentColorDark },
	} = useContext(PageContext);

	const showSecondColumn = !!(pubData.doi || isExpanded);

	return (
		<GridWrapper containerClassName="pub">
			<div className={classNames('pub-details-component', isExpanded && 'expanded')}>
				<div className="expand-contract">
					<Button
						minimal
						icon={
							<Icon
								className="expand-icon"
								icon={isExpanded ? 'collapse-all' : 'expand-all'}
							/>
						}
						onClick={() => setIsExpanded(!isExpanded)}
						style={{ color: accentColorDark }}
					>
						Pub details
					</Button>
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
										beforeCopyPrompt="Copy a doi.org link"
									/>
								</span>
							</React.Fragment>
						)}
						{isExpanded && (
							<React.Fragment>
								<h6>Cite as</h6>
								<div
									className="citation-body"
									ref={copyableCitationRef}
									dangerouslySetInnerHTML={{
										__html: pubData.citationData.pub.apa,
									}}
								/>
								<ButtonGroup>
									<ClickToCopyButton
										className="copy-button"
										icon="duplicate"
										copyString={() => {
											if (copyableCitationRef.current) {
												return copyableCitationRef.current.textContent;
											}
											return '';
										}}
									>
										Copy
									</ClickToCopyButton>
									<Button
										icon="more"
										minimal
										onClick={() => setCitationModalOpen(true)}
									>
										More
									</Button>
								</ButtonGroup>
								<CitationsModal
									isOpen={isCitationModalOpen}
									citationData={pubData.citationData}
									onClose={() => setCitationModalOpen(false)}
								/>
							</React.Fragment>
						)}
					</div>
				)}
			</div>
		</GridWrapper>
	);
};
const CompactContributors = (props) => {
	const { contributors } = props;
	const contributorsWithAvatars = contributors.slice(0, maxContributorsInCompactView);
	const leftoverContributors = contributors.length - maxContributorsInCompactView;
	return (
		<div className="compact-contributors">
			{contributorsWithAvatars.map(({ user }, index) => (
				<Avatar
					// eslint-disable-next-line react/no-array-index-key
					key={index}
					userInitials={user.initials}
					userAvatar={user.avatar}
					width={20}
				/>
			))}
			{leftoverContributors > 0 && <span>&amp; {leftoverContributors} more</span>}
		</div>
	);
};

CompactContributors.propTypes = {
	contributors: PropTypes.array.isRequired,
};

PubDetails.propTypes = propTypes;
export default PubDetails;
