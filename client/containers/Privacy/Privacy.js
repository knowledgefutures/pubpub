import React from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItem } from '@blueprintjs/core';

import { PageWrapper, GridWrapper } from 'components';
import { hydrateWrapper } from 'utils';

import PrivacyPolicy from './PrivacyPolicy';
import PrivacySettings from './PrivacySettings';

require('./privacy.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
};

const Privacy = (props) => {
	const { communityData, locationData, loginData } = props;
	const { tab } = locationData.params;
	return (
		<div id="privacy-container">
			<PageWrapper
				loginData={loginData}
				communityData={communityData}
				locationData={locationData}
				hideNav={locationData.isBasePubPub}
			>
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
			</PageWrapper>
		</div>
	);
};

Privacy.propTypes = propTypes;
export default Privacy;

hydrateWrapper(Privacy);
