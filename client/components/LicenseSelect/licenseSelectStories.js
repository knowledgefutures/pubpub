import React, { useState } from 'react';
import { Button, Spinner } from '@blueprintjs/core';
import { storiesOf } from '@storybook/react';

import { LicenseSelect } from 'components';

const LicenseSelectContainer = () => {
	const [currentLicense, setCurrentLicense] = useState('cc-by');
	return (
		<LicenseSelect
			updateLocalData={(pubData) => setCurrentLicense(pubData.licenseSlug)}
			pubData={{ id: '', licenseSlug: currentLicense, collectionPubs: [] }}
		>
			{({ title, icon, loading }) => (
				<Button icon={icon} text={title} rightIcon={loading && <Spinner size={5} />} />
			)}
		</LicenseSelect>
	);
};

storiesOf('components/LicenseSelect', module).add('default', () => {
	return <LicenseSelectContainer />;
});
