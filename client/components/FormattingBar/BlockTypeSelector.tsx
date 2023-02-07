import React from 'react';
import { Button } from '@blueprintjs/core';

import {
	heading1Toggle,
	heading2Toggle,
	heading3Toggle,
	heading4Toggle,
	heading5Toggle,
	heading6Toggle,
	paragraphToggle,
	codeBlockToggle,
} from 'components/Editor/commands';
import { EditorChangeObject } from 'components/Editor';

import CommandMenu, { CommandMenuDisclosureProps } from './CommandMenu';
import { CommandDefinition } from '../Editor/commands/types';

require('./blockTypeSelector.scss');

type Props = {
	isSmall: boolean;
	editorChangeObject: EditorChangeObject;
};

const paragraphBlockType = {
	key: 'paragraph',
	title: <p>Paragraph</p>,
	label: 'Paragraph',
	command: paragraphToggle,
};

const blockTypeDefinitions = [
	paragraphBlockType,
	{
		key: 'header1',
		title: <h1 className="h1">Header 1</h1>,
		label: 'Header 1',
		command: heading1Toggle,
	},
	{
		key: 'header2',
		title: <h2 className="h2">Header 2</h2>,
		label: 'Header 2',
		command: heading2Toggle,
	},
	{
		key: 'header3',
		title: <h3 className="h3">Header 3</h3>,
		label: 'Header 3',
		command: heading3Toggle,
	},
	{
		key: 'header4',
		title: <h4 className="h4">Header 4</h4>,
		label: 'Header 4',
		command: heading4Toggle,
	},
	{
		key: 'header5',
		title: <h5 className="h5">Header 5</h5>,
		label: 'Header 5',
		command: heading5Toggle,
	},
	{
		key: 'header6',
		title: <h6 className="h6">Header 6</h6>,
		label: 'Header 6',
		command: heading6Toggle,
	},
	{
		key: 'code_block',
		title: (
			<pre>
				<code>Code</code>
			</pre>
		),
		label: 'Code',
		command: codeBlockToggle,
	},
];

const BlockTypeSelector = React.forwardRef((props: Props, ref) => {
	const { editorChangeObject, isSmall, ...restProps } = props;

	const renderDisclosure = (disclosureProps: CommandMenuDisclosureProps) => {
		const { commands, commandStates, disclosureElementProps } = disclosureProps;
		const { ref: innerRef, ...restDisclosureElementProps } = disclosureElementProps;
		const commandsFlat = commands.reduce((a, b) => [...a, ...b], []);

		const activeCommandEntry = commandsFlat.reduce((found, entry) => {
			if (found) {
				return found;
			}
			const commandState = commandStates[entry.key];
			if (commandState?.isActive && 'command' in entry) {
				return entry;
			}
			return null;
		}, null as null | CommandDefinition);

		const matchingBlockType = blockTypeDefinitions.find(
			(def) => def.command === activeCommandEntry?.command,
		);

		const runnableCommandEntries = commandsFlat.filter((command) => {
			const commandState = commandStates[command.key];
			return commandState?.canRun;
		});

		const effectiveBlockType = matchingBlockType || paragraphBlockType;

		return (
			<Button
				minimal
				className="block-type-selector-component"
				rightIcon="caret-down"
				elementRef={innerRef}
				{...restDisclosureElementProps}
				disabled={runnableCommandEntries.length < 2}
				small={isSmall}
			>
				{effectiveBlockType.label}
			</Button>
		);
	};

	return (
		<CommandMenu
			className="block-type-selector-menu pub-body-styles"
			aria-label="Choose text formatting"
			ref={ref}
			commands={[blockTypeDefinitions]}
			disclosure={renderDisclosure}
			editorChangeObject={editorChangeObject}
			{...restProps}
		/>
	);
});

export default BlockTypeSelector;
