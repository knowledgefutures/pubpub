import React from 'react';
import { Node, Mark, Schema, NodeType, MarkType } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { IconName } from 'components';

export type Dispatch = EditorView['dispatch'];
export type Attrs = Node['attrs'] | Mark['attrs'];

export type CommandState = {
	run: () => unknown;
	canRun: boolean;
	isActive: boolean;
};

export type CommandStates = Record<string, CommandState>;

export type CommandStateBuilder = (dispatch: Dispatch, state: EditorState) => CommandState;
export type CommandSpec = (view: EditorView) => (state: EditorState) => CommandState;

export type MenuItemBase = {
	key: string;
	title: React.ReactNode;
	icon?: IconName;
};

export type CommandDefinition = MenuItemBase & {
	command?: CommandSpec;
};

export type CommandSubmenu = MenuItemBase & {
	commands: CommandDefinition[];
};

export type CommandMenuEntry = CommandDefinition | CommandSubmenu;

export type SchemaType = NodeType | MarkType;

export type ToggleActiveFn<S extends SchemaType> = (options: ToggleOptions<S>) => boolean;
export type ToggleCommandFn<S extends SchemaType> = (options: ToggleOptions<S>) => boolean;

export type ToggleOptions<S extends SchemaType> = {
	state: EditorState;
	type: S;
	withAttrs?: Attrs;
	dispatch?: Dispatch;
};

export type CreateToggleOptions<S extends SchemaType> = {
	withAttrs?: Attrs;
	getTypeFromSchema: (schema: Schema) => S;
	commandFn: ToggleCommandFn<S>;
	isActiveFn: ToggleActiveFn<S>;
};
