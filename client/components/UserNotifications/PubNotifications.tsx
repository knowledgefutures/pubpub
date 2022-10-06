import React, { useState } from 'react';
import { Button } from '@blueprintjs/core';
import classNames from 'classnames';

import { communityUrl, pubUrl } from 'utils/canonicalUrls';
import { usePageContext } from 'utils/hooks';
import { PubHeaderBackground, SubscriptionButton } from 'components';

import ThreadNotifications from './ThreadNotifications';
import { FilterTerm, PubNotificationsState } from './types';
import { pubStateMatchesTerm, threadStateMatchesTerm } from './filter';
import { useNotificationsContext } from './userNotificationsContext';

type Props = {
	state: PubNotificationsState;
	filterTerm: FilterTerm;
	container: null | HTMLDivElement;
};

const PubNotifications = (props: Props) => {
	const { state, filterTerm, container } = props;
	const { pub, community, threadStates, subscription, location, pubHeaderTheme } = state;
	const [expanded, setExpanded] = useState(true);
	const [initiallySubscribed] = useState(() => subscription?.status === 'active');
	const { actions } = useNotificationsContext();
	const {
		communityData: { id: currentCommunityId },
	} = usePageContext();
	const inCurrentCommunity = currentCommunityId === community.id;

	const matchesFilterTerm = pubStateMatchesTerm(state, filterTerm);
	const expandedToShowSearchResults = !!(filterTerm && !matchesFilterTerm);
	const derivedExpanded = expanded || expandedToShowSearchResults;

	const filteredThreadStates = expandedToShowSearchResults
		? threadStates.filter((threadState) => threadStateMatchesTerm(threadState, filterTerm))
		: threadStates;

	if (filteredThreadStates.length === 0) {
		return null;
	}

	return (
		<div className={classNames('pub-notifications-component', derivedExpanded && 'expanded')}>
			<PubHeaderBackground
				className="header"
				pubHeaderTheme={pubHeaderTheme}
				communityData={community}
				blur
			>
				<div className="header-content">
					<Button
						disabled={expandedToShowSearchResults}
						aria-label={derivedExpanded ? 'Collapse Pub threads' : 'Expand Pub threads'}
						className="collapse-button"
						onClick={() => setExpanded((e) => !e)}
						minimal
						icon={derivedExpanded ? 'chevron-down' : 'chevron-right'}
					/>
					<div className="text-content">
						<div className="title">
							<a href={pubUrl(community, pub)}>{pub.title}</a>
						</div>
						{!inCurrentCommunity && (
							<div className="community">
								in <a href={communityUrl(community)}>{community.title}</a>
							</div>
						)}
					</div>
					<div className="controls">
						{initiallySubscribed && (
							<SubscriptionButton
								buttonProps={{ small: true }}
								target={{ pubId: location.pubId }}
								subscription={subscription}
								onUpdateSubscription={(status) =>
									actions.updateSubscriptionStatus(location, status)
								}
							>
								<Button small minimal aria-label="Manage subscription" />
							</SubscriptionButton>
						)}
						<Button
							small
							minimal
							icon="cross"
							aria-label="Dismiss"
							onClick={() => actions.dismissPubThreads(location, state)}
						/>
					</div>
				</div>
			</PubHeaderBackground>
			{derivedExpanded &&
				filteredThreadStates.map((threadState) => (
					<ThreadNotifications
						key={threadState.thread.id}
						parentSubscription={subscription}
						state={threadState}
						container={container}
						communityAccentColor={community.accentColorDark!}
					/>
				))}
		</div>
	);
};

export default PubNotifications;
