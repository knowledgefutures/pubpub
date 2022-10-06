import React, { useMemo } from 'react';
import classNames from 'classnames';
import { Button } from 'reakit/Button';

import { Icon } from 'components';
import { Callback } from 'types';
import { capitalize } from 'utils/strings';
import { Tooltip } from '@blueprintjs/core';
import { FacetPropSourceInfo, FacetEditorDisplayStyle } from './types';

require('./facetPropEditorSkeleton.scss');

type Props = {
	children: React.ReactNode;
	label: React.ReactNode;
	onReset: Callback;
	propSourceInfo: FacetPropSourceInfo;
	displayStyle: FacetEditorDisplayStyle;
};

const rootScopeLabel = 'PubPub default';

function getLabelForContributingScope(sourceInfo: FacetPropSourceInfo): string {
	const { contributingScopes, isValueLocal } = sourceInfo;
	const lowestContributingScope = contributingScopes[contributingScopes.length - 1];
	if (isValueLocal) {
		return 'Defined here';
	}
	if (lowestContributingScope) {
		const { kind } = lowestContributingScope;
		if (kind === 'root') {
			return rootScopeLabel;
		}
		const scopeKind = capitalize(kind);
		return `Defined by ${scopeKind}`;
	}
	return 'unknown';
}

function getRevertTargetLabel(sourceInfo: FacetPropSourceInfo): string {
	const { contributingScopes } = sourceInfo;
	const nextLowestScope = contributingScopes[contributingScopes.length - 2];
	if (nextLowestScope) {
		const { kind } = nextLowestScope;
		if (kind === 'root') {
			return rootScopeLabel;
		}
		const scopeKind = capitalize(kind);
		return `${scopeKind} value`;
	}
	return 'unknown';
}

function FacetPropEditorSkeleton(props: Props) {
	const { children, label, propSourceInfo, onReset, displayStyle } = props;
	const { isValueLocal } = propSourceInfo;
	const [inheritanceLabel, revertTarget] = useMemo(
		() => [getLabelForContributingScope(propSourceInfo), getRevertTargetLabel(propSourceInfo)],
		[propSourceInfo],
	);

	const inheritanceIcon = isValueLocal ? (
		<Icon className="inheritance-icon reset-icon" iconSize={12} icon="reset" />
	) : (
		<Icon className="inheritance-icon" iconSize={16} icon="double-chevron-down" />
	);

	const inheritanceElement = isValueLocal ? (
		<Tooltip content={<>Revert to {revertTarget}</>}>{inheritanceIcon}</Tooltip>
	) : (
		inheritanceIcon
	);

	const inheritanceButton = (
		<Button
			className="inheritance-indicator"
			as="div"
			onClick={onReset}
			disabled={!isValueLocal}
		>
			{inheritanceElement}
		</Button>
	);

	return (
		<div
			className={classNames(
				'facet-prop-editor-skeleton-component',
				isValueLocal && 'local-value',
				displayStyle === 'settings' && 'settings-style',
			)}
		>
			<div className="top-row">
				{inheritanceButton}
				<div className="label-group">
					<div className="inheritance-info">{inheritanceLabel}</div>
					<div className="prop-name">{label}</div>
				</div>
			</div>
			<div className="controls-container">{children}</div>
		</div>
	);
}

export default FacetPropEditorSkeleton;
