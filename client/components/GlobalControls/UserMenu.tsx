import type { MenuDisclosureProps } from 'reakit/Menu';

import type { LoginData } from 'types';

import React, { useCallback, useState } from 'react';

import { Button, Classes } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import {
	Avatar,
	Menu,
	MenuItem,
	MenuItemDivider,
	MobileAware,
	type MobileAwareRenderProps,
} from 'components';
import { usePageContext } from 'utils/hooks';

type Props = {
	loginData: LoginData;
};

const handleLogout = () => {
	const cacheBreaker = Math.round(new Date().getTime() / 1000);
	apiFetch('/api/logout').then(() => {
		window.location.href = `/?breakCache=${cacheBreaker}`;
	});
};

const renderDisclosureButton = (
	loginData: LoginData,
	isMobile: boolean,
	renderProps: MobileAwareRenderProps,
	disclosureProps: Omit<MenuDisclosureProps, 'ref'>,
) => {
	const { initials, avatar } = loginData;
	const { ref, className } = renderProps;
	return (
		<Button
			minimal
			large={!isMobile}
			className={className}
			elementRef={ref as any}
			{...disclosureProps}
		>
			<Avatar initials={initials} avatar={avatar} width={isMobile ? 20 : 30} />
		</Button>
	);
};

const renderDisclosure = (loginData: LoginData, disclosureProps: MenuDisclosureProps) => {
	const { ref, ...restDisclosureProps } = disclosureProps;
	return (
		<MobileAware
			ref={ref}
			mobile={(renderProps) =>
				renderDisclosureButton(loginData, true, renderProps, restDisclosureProps)
			}
			desktop={(renderProps) =>
				renderDisclosureButton(loginData, false, renderProps, restDisclosureProps)
			}
		/>
	);
};

type UserCommunity = {
	id: string;
	title: string;
	subdomain: string;
	domain: string | null;
	avatar: string | null;
	headerLogo: string | null;
	accentColorDark: string | null;
};

const getCommunityUrl = (community: UserCommunity, locationData: { isDuqDuq: boolean }) => {
	if (locationData.isDuqDuq) {
		return `https://${community.subdomain}.duqduq.org`;
	}
	return community.domain
		? `https://${community.domain}`
		: `https://${community.subdomain}.pubpub.org`;
};

const getCommunityDisplayUrl = (community: UserCommunity) => {
	return community.domain || `${community.subdomain}.pubpub.org`;
};

const CommunityAvatar = ({ community, size = 24 }: { community: UserCommunity; size?: number }) => {
	const bgColor = community.accentColorDark || '#607D8B';
	const initial = community.title.charAt(0).toUpperCase();
	if (community.avatar) {
		return (
			<img
				src={community.avatar}
				alt=""
				style={{
					width: size,
					height: size,
					borderRadius: 3,
					objectFit: 'cover',
					flexShrink: 0,
				}}
			/>
		);
	}
	return (
		<div
			style={{
				width: size,
				height: size,
				borderRadius: 3,
				backgroundColor: bgColor,
				color: '#fff',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontSize: size * 0.55,
				fontWeight: 600,
				flexShrink: 0,
			}}
		>
			{initial}
		</div>
	);
};

const SkeletonRow = () => (
	<li style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 7px' }}>
		<div className={Classes.SKELETON} style={{ width: 24, height: 24, borderRadius: 3 }} />
		<div style={{ flex: 1 }}>
			<div
				className={Classes.SKELETON}
				style={{ width: 120, height: 12, marginBottom: 4, borderRadius: 2 }}
			/>
			<div className={Classes.SKELETON} style={{ width: 90, height: 10, borderRadius: 2 }} />
		</div>
	</li>
);

const YourCommunitiesSection = ({ communities }: { communities: UserCommunity[] | null }) => {
	const { locationData } = usePageContext();

	// Hide entirely if no communities
	if (communities && communities.length === 0) return null;

	return (
		<>
			<li
				style={{
					fontWeight: 600,
					fontSize: 12,
					color: '#555',
					padding: '10px 7px 5px',
					marginTop: 4,
					borderTop: '1px solid rgba(16, 22, 26, 0.15)',
					// borderBottom: '1px solid rgba(16, 22, 26, 0.1)',
				}}
			>
				Your Communities
			</li>
			<div style={{ maxHeight: 'min(40vh, 300px)', overflowY: 'auto' }}>
				{!communities ? (
					<>
						<SkeletonRow />
						<SkeletonRow />
						<SkeletonRow />
					</>
				) : (
					communities.map((community) => (
						<MenuItem
							key={community.id}
							href={getCommunityUrl(community, locationData)}
							icon={<CommunityAvatar community={community} />}
							className="community-menu-item"
							menuStyle={{
								display: 'flex',
								alignItems: 'center',
							}}
							text={
								<div style={{ lineHeight: 1.3, maxWidth: 200 }}>
									<div
										style={{
											fontWeight: 500,
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
										}}
									>
										{community.title}
									</div>
									<div
										style={{
											fontSize: 11,
											opacity: 0.65,
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
										}}
									>
										{getCommunityDisplayUrl(community)}
									</div>
								</div>
							}
						/>
					))
				)}
			</div>
		</>
	);
};

const UserMenu = (props: Props) => {
	const { loginData } = props;
	const [communities, setCommunities] = useState<UserCommunity[] | null>(null);
	const [hasFetched, setHasFetched] = useState(false);

	const handleVisibleChange = useCallback(
		(visible: boolean) => {
			if (visible && !hasFetched) {
				setHasFetched(true);
				apiFetch
					.get<UserCommunity[]>('/api/users/communities')
					.then(setCommunities)
					.catch(() => setCommunities([]));
			}
		},
		[hasFetched],
	);

	return (
		<Menu
			aria-label="User menu"
			placement="bottom-end"
			// The z-index of the PubHeaderFormatting is 19
			menuStyle={{ zIndex: 20, width: 245 }}
			disclosure={(disclosureProps) => renderDisclosure(loginData, disclosureProps)}
			onVisibleChange={handleVisibleChange}
		>
			<MenuItem
				href={`/user/${loginData.slug}`}
				text={
					<React.Fragment>
						{loginData.fullName}
						<span className="subtext" style={{ marginLeft: 4 }}>
							View Profile
						</span>
					</React.Fragment>
				}
			/>
			<MenuItem href="/legal/settings" text="Privacy &amp; Account Settings" />
			<MenuItem onClick={handleLogout} text="Logout" />
			<YourCommunitiesSection communities={communities} />
		</Menu>
	);
};

export default UserMenu;
