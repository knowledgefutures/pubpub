import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs, number } from '@storybook/addon-knobs';

import Byline from './Byline';

const [A, B, C, D, E, F, G] = [
	'Allyson Maxwell',
	'Li Boyi',
	'Carlos Montilla Vásquez',
	'邓京瀚',
	'Enyinnaya Uchie',
	'Frances van der Hagen',
	'Geum Kyung-Sam',
].map((name, index) => {
	return {
		id: `attribution-${index}`,
		user: {
			id: `user-${index}`,
			fullName: name,
			slug: name
				.toLowerCase()
				.split(' ')
				.join('-'),
		},
	};
});

storiesOf('components/Byline', module).add(
	'default',
	() => (
		<div style={{ margin: '1em' }}>
			<h4>Basic</h4>
			<p>
				{/* @ts-expect-error ts-migrate(2322) FIXME: Type '{ id: string; user: { id: string; fullName: ... Remove this comment to see the full error message */}
				<Byline contributors={[A, B, C, D]} />
			</p>
			<h4>Truncated at number of users</h4>
			<p>
				<Byline
					// @ts-expect-error ts-migrate(2322) FIXME: Type '{ id: string; user: { id: string; fullName: ... Remove this comment to see the full error message
					contributors={[A, B, C, D, E, F, G]}
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'number' is not assignable to type 'never'.
					truncateAt={number('truncateAt', 4, { max: 7, min: 0, range: true })}
				/>
			</p>
			<h4>No linking to users</h4>
			<p>
				{/* @ts-expect-error ts-migrate(2322) FIXME: Type '{ id: string; user: { id: string; fullName: ... Remove this comment to see the full error message */}
				<Byline contributors={[C, F, E, A]} linkToUsers={false} />
			</p>
			<h4>No prefix</h4>
			<p>
				{/* @ts-expect-error ts-migrate(2322) FIXME: Type '{ id: string; user: { id: string; fullName: ... Remove this comment to see the full error message */}
				<Byline contributors={[G, A, B, C]} linkToUsers={false} bylinePrefix={null} />
			</p>
			<h4>Custom empty state</h4>
			<p>
				{/* @ts-expect-error ts-migrate(2322) FIXME: Type 'never[]' is not assignable to type 'never'. */}
				<Byline contributors={[]} renderEmptyState={() => 'No contributors 😥'} />
			</p>
			<h4>Custom suffix</h4>
			<p>
				<Byline
					// @ts-expect-error ts-migrate(2322) FIXME: Type '{ id: string; user: { id: string; fullName: ... Remove this comment to see the full error message
					contributors={[B, F, G, E]}
					// @ts-expect-error ts-migrate(2322) FIXME: Type '() => JSX.Element' is not assignable to type... Remove this comment to see the full error message
					renderSuffix={() => <button type="button">Add more</button>}
				/>
			</p>
			<h4>Custom user labels</h4>
			<p>
				<Byline
					// @ts-expect-error ts-migrate(2322) FIXME: Type '{ id: string; user: { id: string; fullName: ... Remove this comment to see the full error message
					contributors={[C, A, B, D]}
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'never'.
					bylinePrefix={null}
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'false' is not assignable to type 'never'.
					linkToUsers={false}
					// @ts-expect-error ts-migrate(2322) FIXME: Type '(user: any, index: any) => string' is not as... Remove this comment to see the full error message
					renderUserLabel={(user, index) => `(${index + 1}) ${user.fullName}`}
				/>
			</p>
			<h4>Use ampersand</h4>
			<p>
				{/* @ts-expect-error ts-migrate(2322) FIXME: Type '{ id: string; user: { id: string; fullName: ... Remove this comment to see the full error message */}
				<Byline contributors={[B, F, G, E]} ampersand />
			</p>
		</div>
	),
	{ decorators: [withKnobs] },
);
