import React from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItem } from '@blueprintjs/core';

import { PageWrapper, GridWrapper } from 'components';
import { hydrateWrapper } from 'utils';

import PrivacyPolicy from './PrivacyPolicy';
import PrivacySettings from './PrivacySettings';
import Terms from './Terms';

require('./legal.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
};

const Legal = (props) => {
	const { communityData, locationData, loginData } = props;
	const { tab } = locationData.params;
	return (
		<div id="legal-container">
			<PageWrapper
				loginData={loginData}
				communityData={communityData}
				locationData={locationData}
				hideNav={locationData.isBasePubPub}
			>
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
			</PageWrapper>
		</div>
	);
};

Legal.propTypes = propTypes;
export default Legal;

hydrateWrapper(Legal);
