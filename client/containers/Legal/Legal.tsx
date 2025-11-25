import type { Integration, UserNotificationPreferences } from 'types';

import React, { useState } from 'react';

import { Menu, MenuItem } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { GridWrapper } from 'components';
import { usePageContext } from 'utils/hooks';

import AUP from './AUP';
import PrivacyPolicy from './PrivacyPolicy';
import PrivacySettings from './PrivacySettings';
import Terms from './Terms';

import './legal.scss';

type Props = {
	integrations: Integration[];
	userNotificationPreferences?: UserNotificationPreferences;
	userEmail: string;
};

const Legal = (props: Props) => {
	const {
		locationData,
		loginData,
		communityData: { accentColorDark },
	} = usePageContext();
	const { tab } = locationData.params;
	const [userNotificationPreferences, setUserNotificationPreferences] = useState(
		props.userNotificationPreferences,
	);
	const updateUserNotificationPreferences = async (
		preferences: Partial<UserNotificationPreferences>,
	) => {
		setUserNotificationPreferences((state) => {
			return {
				...state,
				...preferences,
			} as UserNotificationPreferences;
		});
		await apiFetch.put('/api/userNotificationPreferences', { preferences });
	};
	return (
		<>
			<style>{`#legal-container .main-content p > a { color: ${accentColorDark}; }`}</style>
			<div id="legal-container">
				<GridWrapper containerClassName="legal" columnClassName="legal-columns">
					<div className="side-content">
						<Menu className="side-menu">
							<MenuItem
								key="terms"
								text="Terms of Service"
								active={tab === 'terms'}
								href="/legal/terms"
							/>
							<MenuItem
								key="privacy"
								text="Privacy Policy"
								active={tab === 'privacy'}
								href="/legal/privacy"
							/>
							<MenuItem
								key="aup"
								text="Acceptable Use Policy"
								active={tab === 'aup'}
								href="/legal/aup"
							/>
							<MenuItem
								key="settings"
								text="Privacy &amp; Account"
								active={tab === 'settings'}
								href="/legal/settings"
							/>
						</Menu>
					</div>
					<div className="main-content">
						{tab === 'terms' && <Terms hostname={locationData.hostname} />}
						{tab === 'privacy' && <PrivacyPolicy />}
						{tab === 'aup' && <AUP />}
						{tab === 'settings' && props.userNotificationPreferences && (
							<PrivacySettings
								isLoggedIn={!!loginData.id}
								integrations={props.integrations}
								userEmail={props.userEmail}
								userNotificationPreferences={userNotificationPreferences}
								onUpdateUserNotificationPreferences={
									updateUserNotificationPreferences
								}
							/>
						)}
					</div>
				</GridWrapper>
			</div>
		</>
	);
};

export default Legal;
