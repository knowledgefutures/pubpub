import React from 'react';
import classNames from 'classnames';

import { Menu, MenuItem, MenuItemDivider } from 'components/Menu';
import { EditorChangeObject } from 'components/Editor';
import { CommandSpec } from 'components/Editor/commands/types';

import { useCommandStates, WithCommandState } from './hooks/useCommandStates';

type CommandDefinition = {
	key: string;
	title: React.ReactNode;
	icon?: string;
	command: CommandSpec;
};

type Props = {
	disclosure: (
		commands: ReturnType<typeof useCommandStates>,
		disclosureProps: any,
	) => React.ReactNode;
	className?: string;
	editorChangeObject: EditorChangeObject;
	commands: CommandDefinition[][];
	markActiveItems?: boolean;
};

const CommandMenu = React.forwardRef((props: Props, ref) => {
	const {
		editorChangeObject: { view },
		className = '',
		commands: statelessCommands,
		disclosure,
		markActiveItems = true,
		...restProps
	} = props;

	const commands = useCommandStates({
		commands: statelessCommands,
		view,
		state: view?.state,
	});

	const renderMenuItemForCommand = (defn: WithCommandState<CommandDefinition>) => {
		const { title, icon, key, commandState } = defn;
		return (
			<MenuItem
				key={key}
				active={markActiveItems && commandState?.isActive}
				disabled={!commandState?.canRun}
				text={title}
				icon={icon}
				onClick={() => {
					commandState?.run();
					view.focus();
				}}
			/>
		);
	};

	return (
		<Menu
			ref={ref}
			{...restProps}
			disclosure={(dp) => disclosure(commands, dp)}
			menuStyle={{ zIndex: 20 }}
			className={classNames('command-menu-component', className)}
		>
			{commands.map((section, index) => {
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
