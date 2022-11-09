import React from 'react';
import { Classes, NonIdealState } from '@blueprintjs/core';

import { GridWrapper, PubPreview } from 'components';
import { usePageContext } from 'utils/hooks';
import UserHeader from './UserHeader';
import UserNav from './UserNav';
import UserEdit from './UserEdit';

require('./user.scss');

type Props = {
	userData: any;
};

const User = (props: Props) => {
	const { userData } = props;
	const { locationData, communityData, loginData } = usePageContext();
	const pubs = (userData.attributions || []).map((attribution) => {
		return attribution.pub;
	});

	const selfProfile = !!loginData.id && userData.id === loginData.id;
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
		const isAuthor = collaborators.some((collaborator) => {
			const isCurrentProfileCollaborator = collaborator.user.id === userData.id;
			return isCurrentProfileCollaborator && collaborator.isAuthor;
		});
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
							<div className={`${Classes.CALLOUT} external-pubs-wrapper`}>
								<a
									href={`https://www.pubpub.org/user/${userData.slug}`}
									className={`${Classes.BUTTON} ${Classes.INTENT_PRIMARY}`}
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
								// @ts-expect-error ts-migrate(2322) FIXME: Type '{ visual: string; title: string; action: Ele... Remove this comment to see the full error message
								visual="widget"
								title="No Pubs"
								action={
									selfProfile && !locationData.isBasePubPub ? (
										<a href="/pub/create" className={Classes.BUTTON}>
											Create New pub
										</a>
									) : undefined
								}
							/>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
export default User;
