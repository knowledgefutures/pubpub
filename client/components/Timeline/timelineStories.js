import React from 'react';
import { storiesOf } from '@storybook/react';

import { Timeline, TimelineItem, TimelineCondenser } from 'components';

storiesOf('components/Timeline', module).add('default', () => (
	<Timeline accentColor="slateblue">
		<TimelineItem
			large
			accentColor="limegreen"
			icon="clean"
			title="A first thing"
			subtitle={
				<>
					<div>One</div>
					<div>Two</div>
					<div>Three</div>
					<div>Four</div>
					<div>Five</div>
					<div>Six</div>
				</>
			}
		/>
		<TimelineCondenser shownItemsLimit={2}>
			<TimelineItem icon="star" title="A smaller thing" subtitle="Hmmm" />
			<TimelineItem icon="star" title="Another smaller thing" subtitle="Yes" />
			<TimelineItem icon="star" title="Yet another smaller thing" subtitle="Yes" />
			<TimelineItem
				large
				hollow
				title="A bigger thing again"
				accentColor="orange"
				icon="document-open"
				subtitle="Oh wow"
			/>
		</TimelineCondenser>
		<TimelineItem title="One more smaller thing" subtitle="Yawn" icon="moon" />
	</Timeline>
));
