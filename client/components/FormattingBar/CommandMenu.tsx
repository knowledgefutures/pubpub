import React from 'react';
import classNames from 'classnames';

import { Menu, MenuItem, MenuItemDivider } from 'components/Menu';

type CommandDefinition = {
	key: string;
	title: React.ReactNode;
	icon?: string;
};

type Props = {
	disclosure: React.ReactNode | (() => React.ReactNode);
	className?: string;
	editorChangeObject: {
		menuItems: {
			canRun: boolean;
			isActive: boolean;
			title: string;
			run: () => any;
		}[];
		view: {
			focus: () => any;
		};
	};
	commands: CommandDefinition[][] | CommandDefinition[];
	markActiveItems?: boolean;
};

const CommandMenu = React.forwardRef((props: Props, ref) => {
	const {
		editorChangeObject: { menuItems = [], view: editorView },
		className = '',
		commands,
		disclosure,
		markActiveItems = true,
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

	const getSectionsFromCommands = (): CommandDefinition[][] => {
		if (Array.isArray(commands[0])) {
			return commands as CommandDefinition[][];
		}
		return [commands as CommandDefinition[]];
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

export default CommandMenu;
