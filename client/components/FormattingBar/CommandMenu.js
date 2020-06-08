import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Menu, MenuItem, MenuItemDivider } from 'components/Menu';

const commandPropType = PropTypes.shape({
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
		editorChangeObject: { menuItems = [], view: editorView },
		className,
		commands,
		disclosure,
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

CommandMenu.propTypes = propTypes;
CommandMenu.defaultProps = defaultProps;
export default CommandMenu;
