import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Menu, MenuItem, MenuItemDivider } from 'components/Menu';

type commandPropType = {
	key: string;
	title: string;
	icon?: string;
};

// @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'string | un... Remove this comment to see the full error message
const commandPropType: PropTypes.Requireable<commandPropType> = PropTypes.shape({
	key: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	icon: PropTypes.string,
});

const propTypes = {
	disclosure: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
	className: PropTypes.string,
	editorChangeObject: PropTypes.shape({
		menuItems: PropTypes.arrayOf(PropTypes.shape({})),
		view: PropTypes.shape({
			focus: PropTypes.func,
		}),
	}).isRequired,
	commands: PropTypes.arrayOf(
		PropTypes.oneOfType([commandPropType, PropTypes.arrayOf(commandPropType)]),
	).isRequired,
	markActiveItems: PropTypes.bool,
};

const defaultProps = {
	className: '',
	markActiveItems: true,
};

const CommandMenu = React.forwardRef((props, ref) => {
	const {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'editorChangeObject' does not exist on ty... Remove this comment to see the full error message
		editorChangeObject: { menuItems = [], view: editorView },
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'className' does not exist on type '{ chi... Remove this comment to see the full error message
		className,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'commands' does not exist on type '{ chil... Remove this comment to see the full error message
		commands,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'disclosure' does not exist on type '{ ch... Remove this comment to see the full error message
		disclosure,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'markActiveItems' does not exist on type ... Remove this comment to see the full error message
		markActiveItems,
		...restProps
	} = props;

	const renderMenuItemForCommand = (command) => {
		const menuItem = menuItems.find((item) => item.title === command.key);
		if (!menuItem || !menuItem.canRun) {
			return null;
		}
		return (
			<MenuItem
				key={command.key}
				// @ts-expect-error ts-migrate(2322) FIXME: Property 'active' does not exist on type 'Intrinsi... Remove this comment to see the full error message
				active={markActiveItems && menuItem.isActive}
				text={command.title}
				icon={command.icon}
				onClick={() => {
					menuItem.run();
					editorView.focus();
				}}
			/>
		);
	};

	const getSectionsFromCommands = () => {
		if (Array.isArray(commands[0])) {
			return commands;
		}
		return [commands];
	};

	return (
		// @ts-expect-error ts-migrate(2322) FIXME: Property 'children' does not exist on type 'Intrin... Remove this comment to see the full error message
		<Menu
			ref={ref}
			{...restProps}
			disclosure={disclosure}
			menuStyle={{ zIndex: 20 }}
			className={classNames('command-menu-component', className)}
		>
			{getSectionsFromCommands().map((section, index) => {
				return (
					// eslint-disable-next-line react/no-array-index-key
					<React.Fragment key={index}>
						{index > 0 && <MenuItemDivider />}
						{section.map(renderMenuItemForCommand)}
					</React.Fragment>
				);
			})}
		</Menu>
	);
});

// @ts-expect-error ts-migrate(2559) FIXME: Type '{ disclosure: Validator<string | number | bo... Remove this comment to see the full error message
CommandMenu.propTypes = propTypes;
// @ts-expect-error ts-migrate(2559) FIXME: Type '{ className: string; markActiveItems: boolea... Remove this comment to see the full error message
CommandMenu.defaultProps = defaultProps;
export default CommandMenu;
