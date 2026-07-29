import React from 'react';

import { Icon } from 'components';

import './cmsModeBanner.scss';

const CmsModeBanner = () => {
	return (
		<div className="cms-mode-banner-component">
			<Icon icon="eye-off" iconSize={16} />
			<div className="text">
				This community is in CMS mode: only logged-in Members can see this page. All other
				visitors will see a not-found page.
			</div>
		</div>
	);
};

export default CmsModeBanner;
