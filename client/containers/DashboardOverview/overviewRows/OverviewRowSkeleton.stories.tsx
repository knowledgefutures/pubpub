import React from 'react';
import { storiesOf } from '@storybook/react';
import { Button, Icon } from '@blueprintjs/core';

import { renderLabelPairs } from './labels';

import OverviewRowSkeleton from './OverviewRowSkeleton';

const iconLabelPairs = renderLabelPairs([
	{ icon: 'globe', label: 'Published 12 days ago' },
	{ icon: 'chat', label: '65' },
]);

storiesOf('containers/DashboardOverview/OverviewRowSkeleton', module).add('default', () => (
	<OverviewRowSkeleton
		title="Machine Learning with Statistical Imputation for Predicting Drug Approvals"
		byline={<div>by Andrew W. Lo, Kien Wei Siah, and Chi Heem Wong</div>}
		href="#"
		leftIcon="pubDoc"
		details={iconLabelPairs}
		rightElement={
			<Button icon={<Icon icon="circle-arrow-right" iconSize={20} />} minimal large />
		}
	/>
));
