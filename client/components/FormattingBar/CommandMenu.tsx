import React from 'react';
import classNames from 'classnames';

import { Menu, MenuItem, MenuItemDivider } from 'components/Menu';
import { EditorChangeObject } from 'components/Editor';
import {
	CommandDefinition,
	CommandMenuEntry,
	CommandStates,
} from 'components/Editor/commands/types';

import { useCommandStates } from './hooks/useCommandStates';

export type CommandMenuDisclosureProps = {
	commands: CommandMenuEntry[][];
	commandStates: CommandStates;
	disclosureElementProps: any;
};

type Props = {
	disclosure: (disclosureProps: CommandMenuDisclosureProps) => React.ReactNode;
	className?: string;
	editorChangeObject: EditorChangeObject;
	commands: CommandMenuEntry[][];
	markActiveItems?: boolean;
};

const CommandMenu = React.forwardRef((props: Props, ref) => {
	const {
		editorChangeObject: { view },
		className = '',
		commands,
		disclosure,
		markActiveItems = true,
		...restProps
	} = props;

	const commandStates = useCommandStates({
		commands,
		view,
		state: view?.state,
	});

	const renderMenuItemForCommandDefinition = (defn: CommandDefinition) => {
		const { title, icon, key } = defn;
		const commandState = commandStates[key];
		return (
			<MenuItem
				key={key}
				active={markActiveItems && commandState?.isActive}
				disabled={!commandState?.canRun}
				text={title}
				icon={icon ?? (commandState?.isActive ? 'tick' : 'blank')}
				onClick={() => {
					commandState?.run();
					view.focus();
				}}
			/>
		);
	};

	const renderMenuItemForCommandEntry = (entry: CommandMenuEntry) => {
		const { key, title, icon } = entry;
		if ('commands' in entry) {
			return (
				<MenuItem text={title} key={key} icon={icon}>
					{entry.commands.map((defn) => renderMenuItemForCommandDefinition(defn))}
				</MenuItem>
			);
		}
		return renderMenuItemForCommandDefinition(entry);
	};

	return (
		<Menu
			ref={ref}
			{...restProps}
			disclosure={(disclosureElementProps) =>
				disclosure({ commands, commandStates, disclosureElementProps })
			}
			menuStyle={{ zIndex: 20 }}
			className={classNames('command-menu-component', className)}
		>
			{commands.map((section, index) => {
				return (
					// eslint-disable-next-line react/no-array-index-key
					<React.Fragment key={index}>
						{index > 0 && <MenuItemDivider />}
						{section.map(renderMenuItemForCommandEntry)}
					</React.Fragment>
				);
			})}
		</Menu>
	);
});

export default CommandMenu;
