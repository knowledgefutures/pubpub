import React, { useState } from 'react';
import { Button, Spinner } from '@blueprintjs/core';
import { storiesOf } from '@storybook/react';

import { LicenseSelect } from 'components';

const LicenseSelectContainer = () => {
	const [currentLicense, setCurrentLicense] = useState('cc-by');
	return (
		<LicenseSelect
			// @ts-expect-error ts-migrate(2322) FIXME: Type '(pubData: any) => void' is not assignable to... Remove this comment to see the full error message
			updateLocalData={(pubData) => setCurrentLicense(pubData.licenseSlug)}
			pubData={
				{ id: '', licenseSlug: currentLicense, collectionPubs: [], releases: [] } as any
			}
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
