import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NonIdealState } from '@blueprintjs/core';

import { GridWrapper, PubPreview, PageWrapper } from 'components';
import { hydrateWrapper } from 'utils';
import UserHeader from './UserHeader';
import UserNav from './UserNav';
import UserEdit from './UserEdit';

require('./user.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	userData: PropTypes.object.isRequired,
};

class User extends Component {
	render() {
		const userData = this.props.userData;
		const pubs =
			userData.attributions
				.map((attribution) => {
					return attribution.pub;
				})
				.filter((pub) => {
					return pub;
				}) || [];
		const loginData = this.props.loginData;
		const selfProfile = loginData.id && userData.id === loginData.id;
		const mode = this.props.locationData.params.mode;
		const localCommunityId = this.props.communityData.id;
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
				<PageWrapper
					loginData={this.props.loginData}
					communityData={this.props.communityData}
					locationData={this.props.locationData}
					hideNav={this.props.locationData.isBasePubPub}
				>
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
											{externalPubs.length === 1 ? '' : 's'} in other
											communities.
										</h5>
										<div>
											{userData.firstName} has published in other PubPub
											communities. Click to go to their full profile.
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
											selfProfile && !this.props.locationData.isBasePubPub ? (
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
				</PageWrapper>
			</div>
		);
	}
}

User.propTypes = propTypes;
export default User;

hydrateWrapper(User);
