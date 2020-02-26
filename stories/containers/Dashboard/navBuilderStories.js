import React from 'react';
import { storiesOf } from '@storybook/react';
import NavBuilder from 'containers/Dashboard/DashboardContent/Settings/NavBuilder';
import { AccentStyle } from 'components';
import { communityData } from 'data';

storiesOf('containers/Dashboard/DashboardContent', module).add('NavBuilder', () => (
	<div id="container">
		<AccentStyle communityData={communityData} isNavHidden={false} />
		<div style={{ padding: '20px' }}>
			<NavBuilder
				initialNav={communityData.navigation}
				prefix={[communityData.navigation[0]]}
				suffix={[communityData.navigation[communityData.navigation.length - 1]]}
				pages={communityData.pages}
				onChange={(nav) => {
					/* eslint-disable-next-line no-console */
					console.log(nav);
				}}
			/>
		</div>
	</div>
));
