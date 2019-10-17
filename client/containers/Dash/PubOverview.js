import React from 'react';
import PropTypes from 'prop-types';
import { AnchorButton, Button, Intent } from '@blueprintjs/core';
import dateFormat from 'dateformat';
import { getAllPubContributors } from 'utils/pubContributors';
import { generateAuthorString } from 'components/PubPreview/pubPreviewUtils';
import Contributors from 'containers/Pub/PubDocument/PubDetails/Contributors';
import { Avatar } from 'components';

require('./pubOverview.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	// loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
};

const PubOverview = (props) => {
	const { communityData, locationData } = props;
	const pubSlug = locationData.params.pubSlug;
	const activePub = communityData.pubs.find((pub) => pub.slug === pubSlug);
	const contributors = getAllPubContributors(activePub);
	return (
		<div className="pub-overview-component">
			<div className="header">
				<Avatar
					avatar={activePub.avatar}
					initials={activePub.title[0]}
					communityData={communityData}
					width={75}
					isBlock={true}
				/>
				<div className="header-name">
					<div className="title">{activePub.title}</div>
					<div className="author">{generateAuthorString(activePub)}</div>
					<div>
						Created: {dateFormat(activePub.createdAt, 'mmm dd, yyyy')}
						{activePub.DOI ? ` · ${activePub.doi}` : ''}
					</div>
				</div>
				<div className="header-buttons">
					<Button text="New Conversation" />
					<AnchorButton
						href={`/pub/${activePub.slug}`}
						intent={Intent.PRIMARY}
						text="Read Pub"
					/>
				</div>
			</div>
			<div className="section">
				<div className="section-title">Branches</div>
				<div className="branch-row">
					<div className="one">#public</div>
					<div className="two">Last updated 2 days ago</div>
					<div className="three">
						<AnchorButton
							href={`/pub/${activePub.slug}/branch/1`}
							small
							text="Go to Branch"
						/>
						<Button small text="New Review" />
						<Button small text="New Merge Request" />
					</div>
				</div>
				<div className="branch-row">
					<div className="one">#draft</div>
					<div className="two">Last updated 4 hours ago</div>
					<div className="three">
						<AnchorButton
							href={`/pub/${activePub.slug}/branch/2`}
							small
							text="Go to Branch"
						/>
						<Button small text="New Review" />
						<Button small text="New Merge Request" />
					</div>
				</div>
			</div>

			<div className="section">
				<div className="section-title">Contributors</div>
				<Contributors contributors={contributors} />
			</div>
		</div>
	);
};

PubOverview.propTypes = propTypes;
export default PubOverview;
