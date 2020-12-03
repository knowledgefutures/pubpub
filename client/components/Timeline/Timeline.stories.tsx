import React from 'react';
import { storiesOf } from '@storybook/react';

import { Timeline, TimelineItem, TimelineCondenser } from 'components';

storiesOf('components/Timeline', module).add('default', () => (
	// @ts-expect-error ts-migrate(2746) FIXME: This JSX tag's 'children' prop expects a single ch... Remove this comment to see the full error message
	<Timeline accentColor="slateblue">
		<TimelineItem
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
			large
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
			accentColor="limegreen"
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
			icon="clean"
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
			title="A first thing"
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
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
		{/* @ts-expect-error ts-migrate(2786) FIXME: 'TimelineCondenser' cannot be used as a JSX compon... Remove this comment to see the full error message */}
		<TimelineCondenser shownItemsLimit={2}>
			{/* @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'. */}
			<TimelineItem icon="star" title="A smaller thing" subtitle="Hmmm" />
			{/* @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'. */}
			<TimelineItem icon="star" title="Another smaller thing" subtitle="Yes" />
			{/* @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'. */}
			<TimelineItem icon="star" title="Yet another smaller thing" subtitle="Yes" />
			<TimelineItem
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
				large
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
				hollow
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				title="A bigger thing again"
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				accentColor="orange"
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				icon="document-share"
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				subtitle="Oh wow"
			/>
		</TimelineCondenser>
		{/* @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'. */}
		<TimelineItem title="One more smaller thing" subtitle="Yawn" icon="moon" />
	</Timeline>
));
