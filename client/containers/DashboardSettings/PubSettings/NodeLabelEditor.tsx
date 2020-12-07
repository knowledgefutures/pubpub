import { Checkbox } from '@blueprintjs/core';
import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { useDebounce } from 'use-debounce';
import classNames from 'classnames';

import { InputField } from 'client/components';
import { getDefaultNodeLabels, nodeDefaults } from 'client/components/Editor/utils/references';
import {
	NodeLabelMap,
	ReferenceableNodeType,
	referenceableNodeTypes,
} from 'client/components/Editor/types';

require('./nodeLabelEditor.scss');

export type NodeLabelEditorRowProps = {
	type: string;
	enabled: boolean;
	text: string;
	onTextChange: (label: string) => unknown;
	onToggle: (enabled: boolean) => unknown;
};

const NodeLabelEditorRow = (props: NodeLabelEditorRowProps) => {
	const { enabled, type, text, onTextChange, onToggle } = props;

	return (
		<tr className={classNames(!enabled && 'disabled')}>
			<td>{type}</td>
			<td>
				<Checkbox
					checked={enabled}
					onChange={(e) => onToggle((e.target as HTMLInputElement).checked)}
				/>
			</td>
			<td>
				<InputField
					type="text"
					onChange={(e) => onTextChange(e.target.value)}
					value={text}
					isDisabled={!enabled}
				/>
			</td>
		</tr>
	);
};

export type NodeLabelEditorProps = {
	pubData: any;
	updatePubData: (values: any) => void;
};

enum NodeLabelEditorActionType {
	Toggle = 'toggle',
	ToggleAll = 'toggle_all',
	UpdateLabel = 'update_label',
}

type NodeLabelEditorAction =
	| {
			type: NodeLabelEditorActionType.Toggle;
			payload: { nodeType: string; enabled: boolean };
	  }
	| { type: NodeLabelEditorActionType.ToggleAll }
	| { type: NodeLabelEditorActionType.UpdateLabel; payload: { nodeType: string; text: string } };

const allNodeLabelsEnabled = (state: NodeLabelMap) =>
	Object.values(state).every((label) => label.enabled);

const nodeLabelEditorReducer = (state: NodeLabelMap, action: NodeLabelEditorAction) => {
	switch (action.type) {
		case NodeLabelEditorActionType.Toggle: {
			const { nodeType, enabled } = action.payload;
			return {
				...state,
				[nodeType]: { ...state[nodeType], enabled: enabled },
			};
		}
		case NodeLabelEditorActionType.ToggleAll: {
			const enabled = !allNodeLabelsEnabled(state);

			return Object.entries(state).reduce((acc, [nodeType, label]) => {
				return { ...acc, [nodeType]: { ...label, enabled: enabled } };
			}, {} as NodeLabelMap);
		}
		case NodeLabelEditorActionType.UpdateLabel: {
			const { nodeType, text } = action.payload;
			return {
				...state,
				[nodeType]: { ...state[nodeType], text: text },
			};
		}
	}
};

const useNodeLabelEditorState = (pub: any) => {
	const initialState = useMemo(() => getDefaultNodeLabels(pub), []);
	const [state, dispatch] = useReducer(nodeLabelEditorReducer, initialState);
	const toggleNode = useCallback(
		(nodeType: string, enabled: boolean) =>
			dispatch({
				type: NodeLabelEditorActionType.Toggle,
				payload: { nodeType: nodeType, enabled: enabled },
			}),
		[],
	);
	const updateLabel = useCallback(
		(nodeType: string, text: string) =>
			dispatch({
				type: NodeLabelEditorActionType.UpdateLabel,
				payload: { nodeType: nodeType, text: text },
			}),
		[],
	);
	const toggleAll = useCallback(
		() => dispatch({ type: NodeLabelEditorActionType.ToggleAll }),
		[],
	);

	return { state: state, toggleAll: toggleAll, toggleNode: toggleNode, updateLabel: updateLabel };
};

const NodeLabelEditor = (props: NodeLabelEditorProps) => {
	const { pubData, updatePubData } = props;
	const { state, toggleAll, toggleNode, updateLabel } = useNodeLabelEditorState(pubData);
	const [stateToPersist] = useDebounce(state, 500);
	const initialState = useMemo(() => state, []);

	useEffect(() => {
		if (stateToPersist !== initialState) {
			updatePubData({
				nodeLabels: stateToPersist,
			});
		}
	}, [stateToPersist]);

	return (
		<div className="node-label-editor-component">
			<p>
				You can enable automatic numbering for different types of blocks, and choose the
				text that will be used to reference them within the Pub. By giving two types of
				blocks the same name, you can group them into one ordering list (i.e., if you want
				both images and videos to be "figures" and share the same numbering, give them both
				the label "Figure").
			</p>
			<table className="bp3-html-table bp3-small">
				<thead>
					<tr>
						<th>Type</th>
						<th>Enabled</th>
						<th>Label</th>
					</tr>
				</thead>
				<tbody>
					{referenceableNodeTypes.map((nodeType) => {
						const { enabled, text } = state[nodeType];

						return (
							<NodeLabelEditorRow
								key={nodeType}
								type={nodeDefaults[nodeType as ReferenceableNodeType].text}
								enabled={enabled}
								text={text}
								onTextChange={(text) => updateLabel(nodeType, text)}
								onToggle={(enabled) => toggleNode(nodeType, enabled)}
							/>
						);
					})}
				</tbody>
			</table>
			<Checkbox
				label="Toggle All"
				checked={allNodeLabelsEnabled(state)}
				onClick={toggleAll}
				className="toggle-all"
			/>
		</div>
	);
};

export default NodeLabelEditor;
