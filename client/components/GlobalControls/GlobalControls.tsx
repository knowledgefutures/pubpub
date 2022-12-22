import React from 'react';

import {
	ScopeDropdown,
	Menu,
	UserNotificationsPopover,
	DevCommunitySwitcherMenu,
} from 'components';
import { usePageContext } from 'utils/hooks';
import { canSelectCommunityForDevelopment } from 'utils/environment';
import { pubPubIcons } from 'client/utils/icons';

import UserMenu from './UserMenu';
import LoginButton from './LoginButton';
import CreatePubButton from './CreatePubButton';
import GlobalControlsButton from './GlobalControlsButton';

require('./globalControls.scss');

type Props = {
	loggedIn: boolean;
	isBasePubPub?: boolean;
};

const GlobalControls = (props: Props) => {
	const { isBasePubPub = false, loggedIn } = props;
	const {
		locationData,
		loginData,
		communityData: { hideCreatePubButton },
		scopeData: {
			activePermissions: { canManage },
		},
	} = usePageContext();

	const renderSearch = () => {
		return (
			<GlobalControlsButton
				href="/search"
				aria-label="Search"
				desktop={{ text: 'Search' }}
				mobile={{ icon: 'search' }}
			/>
		);
	};

	const renderDashboardMenu = () => {
		return (
			<Menu
				aria-label="Dashboard menu"
				placement="bottom-end"
				menuStyle={{ zIndex: 20 }}
				disclosure={
					<GlobalControlsButton
						mobile={{ icon: 'settings' }}
						desktop={{ text: 'Dashboard', rightIcon: 'caret-down' }}
					/>
				}
			>
				<ScopeDropdown />
			</Menu>
		);
	};

	const renderNotificiations = () => {
		if (loggedIn) {
			return (
				<UserNotificationsPopover>
					{({ hasUnreadNotifications }) => (
						<GlobalControlsButton
							aria-label="Notifications inbox"
							mobileOrDesktop={{
								icon: hasUnreadNotifications ? 'inbox-update' : 'inbox',
							}}
						/>
					)}
				</UserNotificationsPopover>
			);
		}
		return null;
	};

	const renderItemsVisibleFromCommunity = () => {
		if (!isBasePubPub) {
			const canCreatePub = loggedIn && (!hideCreatePubButton || canManage);
			return (
				<>
					{canCreatePub && <CreatePubButton />}
					{renderSearch()}
					{renderDashboardMenu()}
					{renderNotificiations()}
				</>
			);
		}
		return null;
	};

	const renderBasePubPubLinks = () => {
		if (isBasePubPub) {
			return (
				<>
					<GlobalControlsButton href="/explore" mobileOrDesktop={{ text: 'Explore' }} />
					<GlobalControlsButton href="/pricing" mobileOrDesktop={{ text: 'Pricing' }} />
					<GlobalControlsButton href="/about" mobileOrDesktop={{ text: 'About' }} />
					{renderSearch()}
				</>
			);
		}
		return null;
	};

	const renderUserMenuOrLogin = () => {
		if (loggedIn) {
			return <UserMenu loginData={loginData} />;
		}
		return <LoginButton locationData={locationData} />;
	};

	return (
		<div className="global-controls-component">
			{canSelectCommunityForDevelopment() && (
				<DevCommunitySwitcherMenu
					disclosure={
						<GlobalControlsButton
							mobileOrDesktop={{
								icon: pubPubIcons.community,
								rightIcon: 'caret-down',
							}}
						/>
					}
				/>
			)}
			{renderItemsVisibleFromCommunity()}
			{renderBasePubPubLinks()}
			{renderUserMenuOrLogin()}
		</div>
	);
};

export default GlobalControls;
