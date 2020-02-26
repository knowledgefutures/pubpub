import React from 'react';
import { Menu, MenuItem } from '@blueprintjs/core';
import { GridWrapper } from 'components';
import { usePageContext } from 'utils/hooks';
import PrivacyPolicy from './PrivacyPolicy';
import PrivacySettings from './PrivacySettings';
import Terms from './Terms';

require('./legal.scss');

const Legal = () => {
	const { locationData, loginData } = usePageContext();
	const { tab } = locationData.params;
	return (
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
							text="Privacy policy"
							active={tab === 'privacy'}
							href="/legal/privacy"
						/>
						<MenuItem
							key="settings"
							text="Privacy settings"
							active={tab === 'settings'}
							href="/legal/settings"
						/>
					</Menu>
				</div>
				<div className="main-content">
					{tab === 'terms' && <Terms hostname={locationData.hostname} />}
					{tab === 'privacy' && <PrivacyPolicy />}
					{tab === 'settings' && <PrivacySettings isLoggedIn={!!loginData.id} />}
				</div>
			</GridWrapper>
		</div>
	);
};

export default Legal;
