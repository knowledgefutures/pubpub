import React from 'react';
import { storiesOf } from '@storybook/react';
import { Menu, MenuItem, MenuItemDivider, MenuButton } from 'components/Menu';
import { Button } from '@blueprintjs/core';

const items = (
	<React.Fragment>
		{/* @ts-expect-error ts-migrate(2322) FIXME: Property 'icon' does not exist on type 'IntrinsicA... Remove this comment to see the full error message */}
		<MenuItem icon="doughnut-chart" text="hello" />
		{/* @ts-expect-error ts-migrate(2322) FIXME: Property 'icon' does not exist on type 'IntrinsicA... Remove this comment to see the full error message */}
		<MenuItem icon="git-branch" text="hi" />
		<MenuItemDivider />
		{/* @ts-expect-error ts-migrate(2322) FIXME: Property 'children' does not exist on type 'Intrin... Remove this comment to see the full error message */}
		<MenuItem icon="paperclip" text="what's up">
			{/* @ts-expect-error ts-migrate(2322) FIXME: Property 'text' does not exist on type 'IntrinsicA... Remove this comment to see the full error message */}
			<MenuItem text="hola — a longer item" />
			{/* @ts-expect-error ts-migrate(2322) FIXME: Property 'children' does not exist on type 'Intrin... Remove this comment to see the full error message */}
			<MenuItem text="what's in here">
				<MenuItem
					// @ts-expect-error ts-migrate(2322) FIXME: Property 'text' does not exist on type 'IntrinsicA... Remove this comment to see the full error message
					text="i wonder if you can click me"
					// eslint-disable-next-line no-alert
					onClick={() => alert('You found it!')}
				/>
			</MenuItem>
		</MenuItem>
	</React.Fragment>
);

storiesOf('components/Menu', module)
	.add('manual-button', () => {
		return (
			// @ts-expect-error ts-migrate(2322) FIXME: Property 'children' does not exist on type 'Intrin... Remove this comment to see the full error message
			<Menu
				disclosure={(props) => {
					const { ref, ...restProps } = props;
					return (
						<Button rightIcon="caret-down" {...restProps} elementRef={props.ref}>
							Hello there
						</Button>
					);
				}}
			>
				{items}
			</Menu>
		);
	})
	.add('menu-button', () => {
		return (
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'null | un... Remove this comment to see the full error message
			<MenuButton buttonContent="Click me!" buttonProps={{ rightIcon: 'caret-down' }}>
				{items}
			</MenuButton>
		);
	})
	.add('div', () => {
		// @ts-expect-error ts-migrate(2322) FIXME: Property 'children' does not exist on type 'Intrin... Remove this comment to see the full error message
		return <Menu disclosure={<div>Hello!</div>}>{items}</Menu>;
	});
