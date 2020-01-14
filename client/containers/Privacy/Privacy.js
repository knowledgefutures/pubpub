import React from 'react';
import { Menu, MenuItem } from '@blueprintjs/core';
import { GridWrapper } from 'components';
import { usePageContext } from 'utils/hooks';
import PrivacyPolicy from './PrivacyPolicy';
import PrivacySettings from './PrivacySettings';

require('./privacy.scss');

const Privacy = () => {
	const { locationData, loginData } = usePageContext();
	const { tab } = locationData.params;
	return (
		<div id="privacy-container">
			<GridWrapper containerClassName="privacy" columnClassName="privacy-columns">
				<div className="side-content">
					<Menu className="side-menu">
						<MenuItem
							key="policy"
							text="Privacy policy"
							active={tab === 'policy'}
							href="/privacy/policy"
						/>
						<MenuItem
							key="settings"
							text="Privacy settings"
							active={tab === 'settings'}
							href="/privacy/settings"
						/>
					</Menu>
				</div>
				<div className="main-content">
					{tab === 'settings' && <PrivacySettings isLoggedIn={!!loginData.id} />}
					{tab === 'policy' && <PrivacyPolicy />}
				</div>
			</GridWrapper>
		</div>
	);
};

export default Privacy;
