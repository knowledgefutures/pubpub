import React, { type MouseEvent, useCallback, useLayoutEffect, useMemo, useReducer } from 'react';

import { Classes, type IconName, type ITreeNode, Tooltip, Tree } from '@blueprintjs/core';

import { expect } from 'utils/assert';

// TODO: Export this from @pubpub/deposit-utils
export type DepositNode =
	| {
			type: 'element';
			name: string;
			attributes: { [key: string]: unknown };
			children: DepositNode[];
	  }
	| {
			type: 'text';
			value: string;
	  };

type NodePath = number[];

type TreeAction =
	| { type: 'RESET'; payload: ITreeNode[] }
	| { type: 'DESELECT_ALL' }
	| { type: 'SET_IS_EXPANDED'; payload: { path: NodePath; isExpanded: boolean } }
	| { type: 'SET_IS_SELECTED'; payload: { path: NodePath; isSelected: boolean } };

function mapTreeNodes(node: ITreeNode, callback: (node: ITreeNode) => ITreeNode): ITreeNode {
	return {
		...callback(node),
		childNodes: node.childNodes?.map((child) => mapTreeNodes(child, callback)),
	};
}

function depositTreeReducer(state: ITreeNode[], action: TreeAction) {
	switch (action.type) {
		case 'RESET':
			return action.payload;
		case 'DESELECT_ALL': {
			return state.map((root) =>
				mapTreeNodes(root, (node) => ({
					...node,
					isSelected: false,
				})),
			);
		}
		case 'SET_IS_EXPANDED': {
			const next = [...state];
			const node = Tree.nodeFromPath(action.payload.path, next);
			node.isExpanded = action.payload.isExpanded;
			return next;
		}
		case 'SET_IS_SELECTED': {
			const next = [...state];
			const node = Tree.nodeFromPath(action.payload.path, next);
			node.isSelected = action.payload.isSelected;
			return next;
		}
		default:
			return state;
	}
}

const nodeNameToIcon: Record<string, IconName> = {
	publisher: 'home',
	publicationYear: 'calendar',
	identifier: 'id-number',
	titles: 'font',
	version: 'numerical',
	alternateIdentifiers: 'id-number',
	contributors: 'person',
	creators: 'person',
	dates: 'calendar',
	subjects: 'search',
	descriptions: 'manually-entered-data',
	formats: 'layers',
	language: 'translate',
};

const supportedAttributes = new Set([
	'dateType',
	'identifierType',
	'alternateIdentifierType',
	'relatedIdentifierType',
	'resourceTypeGeneral',
	'descriptionType',
	'relatedItemType',
	'relationType',
	'nameIdentifierScheme',
	'schemeURI',
]);

const dateNodes = new Set(['date']);

function depositNodeToBlueprintTreeNode(node: DepositNode): ITreeNode | undefined {
	if (node.type === 'text') {
		return { id: `${node.type}:${node.value}`, label: node.value };
	}
	const icon = nodeNameToIcon[node.name];
	if (node.children.length === 0) {
		return undefined;
	}
	const nodeAttrs =
		node.attributes &&
		Object.entries(node.attributes).filter(([key]) => supportedAttributes.has(key));
	const label =
		nodeAttrs && nodeAttrs.length > 0 ? (
			<Tooltip
				className={Classes.TOOLTIP_INDICATOR}
				content={
					<div className="datacite-deposit-attr-tooltip">
						{nodeAttrs.map(([key, value]) => (
							<React.Fragment key={key}>
								<dt>{key}</dt>
								<dd>{String(value)}</dd>
							</React.Fragment>
						))}
					</div>
				}
			>
				{node.name}
			</Tooltip>
		) : (
			node.name
		);
	const sharedAttrs = {
		id: `${node.type}:${node.name}:${JSON.stringify(nodeAttrs)}`,
		label,
		icon: icon as IconName,
	};
	if (node.children.length === 1) {
		if (node.children[0].type === 'text') {
			const firstChild = node.children[0];
			return {
				...sharedAttrs,
				secondaryLabel: dateNodes.has(node.name)
					? new Date(firstChild.value).toString()
					: firstChild.value,
			};
		}
		return {
			...sharedAttrs,
			childNodes: node.children
				.map(depositNodeToBlueprintTreeNode)
				.filter((x): x is ITreeNode => Boolean(x)),
			isExpanded: true,
		};
	}
	return {
		...sharedAttrs,
		childNodes: node.children
			.map(depositNodeToBlueprintTreeNode)
			.filter((x): x is ITreeNode => Boolean(x)),
	};
}

function expand(path: NodePath) {
	return {
		type: 'SET_IS_EXPANDED' as const,
		payload: { path, isExpanded: true },
	};
}

function collapse(path: NodePath) {
	return {
		type: 'SET_IS_EXPANDED' as const,
		payload: { path, isExpanded: false },
	};
}

function select(path: NodePath, isSelected: boolean) {
	return {
		type: 'SET_IS_SELECTED' as const,
		payload: { path, isSelected },
	};
}

function deselectAll() {
	return { type: 'DESELECT_ALL' as const };
}

type Props = {
	deposit: DepositNode;
};

export function DataciteDepositPreview(props: Props) {
	const { deposit } = props;
	const root = useMemo(() => expect(depositNodeToBlueprintTreeNode(deposit)), [deposit]);
	const [nodes, dispatch] = useReducer(depositTreeReducer, [root]);
	const handleNodeClick = useCallback(
		(node: ITreeNode, path: NodePath, event: MouseEvent<HTMLElement>) => {
			const selected = node.isSelected;
			if (!event.shiftKey) {
				dispatch(deselectAll());
			}
			dispatch(select(path, selected == null ? true : !selected));
		},
		[],
	);
	const handleNodeCollapse = useCallback((_node: ITreeNode, path: NodePath) => {
		dispatch(collapse(path));
	}, []);
	const handleNodeExpand = useCallback((_node: ITreeNode, path: NodePath) => {
		dispatch(expand(path));
	}, []);
	useLayoutEffect(() => {
		dispatch(expand([0]));
	}, []);
	return (
		<Tree
			contents={nodes}
			onNodeClick={handleNodeClick}
			onNodeCollapse={handleNodeCollapse}
			onNodeExpand={handleNodeExpand}
		/>
	);
}
