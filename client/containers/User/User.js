import React from 'react';
import PropTypes from 'prop-types';
import { NonIdealState } from '@blueprintjs/core';
import { GridWrapper, PubPreview } from 'components';
import { usePageContext } from 'utils/hooks';
import UserHeader from './UserHeader';
import UserNav from './UserNav';
import UserEdit from './UserEdit';

require('./user.scss');

const propTypes = {
	userData: PropTypes.object.isRequired,
};

const User = (props) => {
	const { userData } = props;
	const { locationData, communityData, loginData } = usePageContext();
	const pubs = (userData.attributions || []).map((attribution) => {
		return attribution.pub;
	});

	const selfProfile = loginData.id && userData.id === loginData.id;
	const mode = locationData.params.mode;
	const localCommunityId = communityData.id;
	const communityPubs = pubs.filter((pub) => {
		return !localCommunityId || pub.communityId === localCommunityId;
	});
	const externalPubs = pubs.filter((pub) => {
		return localCommunityId && pub.communityId !== localCommunityId;
	});
	const authoredPubs = communityPubs.filter((pub) => {
		const collaborators = pub.attributions || [];
		const isAuthor = collaborators.reduce((prev, curr) => {
			if (curr.user.id === loginData.id && curr.isAuthor) {
				return true;
			}
			return prev;
		}, false);
		return isAuthor;
	});
	const pubsToRender = mode === 'authored' ? authoredPubs : communityPubs;

	return (
		<div id="user-container">
			{mode === 'edit' && <UserEdit userData={userData} />}
			{mode !== 'edit' && (
				<div>
					<GridWrapper containerClassName="narrow">
						<UserHeader userData={userData} isUser={selfProfile} />
					</GridWrapper>

					<GridWrapper containerClassName="narrow nav">
						<UserNav
							userSlug={userData.slug}
							activeTab={mode}
							allPubsCount={communityPubs.length}
							authoredPubsCount={authoredPubs.length}
						/>
					</GridWrapper>
					{!!externalPubs.length && (
						<GridWrapper containerClassName="narrow nav">
							<div className="bp3-callout external-pubs-wrapper">
								<a
									href={`https://www.pubpub.org/user/${userData.slug}`}
									className="bp3-button bp3-intent-primary"
								>
									Go to Full Profile
								</a>
								<h5>
									{externalPubs.length} pub
									{externalPubs.length === 1 ? '' : 's'} in other communities.
								</h5>
								<div>
									{userData.firstName} has published in other PubPub communities.
									Click to go to their full profile.
								</div>
							</div>
						</GridWrapper>
					)}
					<div className="container narrow content">
						{pubsToRender.map((pub) => {
							return (
								<div key={`pub-${pub.id}`} className="row">
									<div className="col-12">
										<PubPreview
											pubData={pub}
											communityData={
												localCommunityId ? undefined : pub.community
											}
											size="medium"
										/>
									</div>
								</div>
							);
						})}
						{!pubsToRender.length && (
							<NonIdealState
								visual="widget"
								title="No Pubs"
								action={
									selfProfile && !locationData.isBasePubPub ? (
										<a href="/pub/create" className="bp3-button">
											Create New pub
										</a>
									) : (
										undefined
									)
								}
							/>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

User.propTypes = propTypes;
export default User;
