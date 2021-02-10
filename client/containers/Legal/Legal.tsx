import React from 'react';
import { Menu, MenuItem } from '@blueprintjs/core';

import { GridWrapper } from 'components';
import { usePageContext } from 'utils/hooks';

import PrivacySettings from './PrivacySettings';
import Terms from './Terms';
import PrivacyPolicy from './PrivacyPolicy';
import AUP from './AUP';

require('./legal.scss');

const Legal = () => {
	const {
		locationData,
		loginData,
		communityData: { accentColorDark },
	} = usePageContext();
	const { tab } = locationData.params;
	return (
		<>
			<style>{`#legal-container .main-content a { color: ${accentColorDark}; }`}</style>
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
								text="Privacy settings"
								active={tab === 'settings'}
								href="/legal/settings"
							/>
						</Menu>
					</div>
					<div className="main-content">
						{tab === 'terms' && <Terms hostname={locationData.hostname} />}
						{tab === 'privacy' && <PrivacyPolicy />}
						{tab === 'aup' && <AUP />}
						{tab === 'settings' && <PrivacySettings isLoggedIn={!!loginData.id} />}
					</div>
				</GridWrapper>
			</div>
		</>
	);
};

export default Legal;
