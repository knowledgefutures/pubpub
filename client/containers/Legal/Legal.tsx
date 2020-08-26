import React from 'react';
import { Menu, MenuItem } from '@blueprintjs/core';
import { GridWrapper } from 'components';
import { usePageContext } from 'utils/hooks';
import PrivacyPolicy from './PrivacyPolicy';
import PrivacySettings from './PrivacySettings';
import Terms from './Terms';
import ProposedTerms from './ProposedTerms';
import ProposedPrivacy from './ProposedPrivacy';
import ProposedAUP from './ProposedAUP';

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
						<MenuItem
							key="proposed-terms"
							text="Proposed Terms of Service"
							active={tab === 'proposed-terms'}
							href="/legal/proposed-terms"
						/>
						<MenuItem
							key="proposed-privacy"
							text="Proposed Privacy Policy"
							active={tab === 'proposed-privacy'}
							href="/legal/proposed-privacy"
						/>
						<MenuItem
							key="proposed-aup"
							text="Proposed Acceptable Use Policy"
							active={tab === 'proposed-aup'}
							href="/legal/proposed-aup"
						/>
					</Menu>
				</div>
				<div className="main-content">
					{tab === 'terms' && <Terms hostname={locationData.hostname} />}
					{tab === 'privacy' && <PrivacyPolicy />}
					{tab === 'proposed-terms' && <ProposedTerms hostname={locationData.hostname} />}
					{tab === 'proposed-privacy' && <ProposedPrivacy />}
					{tab === 'proposed-aup' && <ProposedAUP />}
					{tab === 'settings' && <PrivacySettings isLoggedIn={!!loginData.id} />}
				</div>
			</GridWrapper>
		</div>
	);
};

export default Legal;
