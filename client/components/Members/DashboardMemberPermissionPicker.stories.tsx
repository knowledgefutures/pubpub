import React from 'react';
import { storiesOf } from '@storybook/react';

import MemberPermissionPicker from 'components/Members/MemberPermissionPicker';
// import { locationData, loginData, communityData } from 'utils/storybook/data';

const style = { padding: '2em' };
storiesOf('Containers/DashboardMembers', module).add('MemberPermissionPicker', () => (
	<React.Fragment>
		<div style={style}>
			<MemberPermissionPicker
				activeTargetType="pub"
				canAdmin={true}
				activePermission="manage"
			/>
		</div>
		<div style={style}>
			<MemberPermissionPicker
				activeTargetType="collection"
				canAdmin={true}
				activePermission="manage"
			/>
		</div>
		<div style={style}>
			<MemberPermissionPicker
				activeTargetType="community"
				canAdmin={true}
				activePermission="manage"
			/>
		</div>
		<div style={style}>
			<MemberPermissionPicker
				activeTargetType="community"
				canAdmin={false}
				activePermission="manage"
			/>
		</div>
	</React.Fragment>
));
