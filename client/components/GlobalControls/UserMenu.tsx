import React from 'react';
import { Button } from '@blueprintjs/core';
import { MenuDisclosureProps } from 'reakit/Menu';

import { LoginData } from 'types';
import { Avatar, Menu, MenuItem, MobileAware, MobileAwareRenderProps } from 'components';
import { apiFetch } from 'client/utils/apiFetch';

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

const UserMenu = (props: Props) => {
	const { loginData } = props;
	return (
		<Menu
			aria-label="User menu"
			placement="bottom-end"
			// The z-index of the PubHeaderFormatting is 19
			menuStyle={{ zIndex: 20 }}
			disclosure={(disclosureProps) => renderDisclosure(loginData, disclosureProps)}
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
			<MenuItem href="/legal/settings" text="Privacy settings" />
			<MenuItem onClick={handleLogout} text="Logout" />
		</Menu>
	);
};

export default UserMenu;
