import React, { useCallback } from 'react';
import classNames from 'classnames';
import { Spinner } from '@blueprintjs/core';

import {
	FacetDefinition,
	FacetProp,
	FacetPropCascadeResult,
	FacetSourceScope,
	mapFacet,
	FacetCascadeNotImplError,
} from 'facets';
import { SettingsSection } from 'components';

import {
	FacetPropSourceInfo,
	GenericFacetEditorProps,
	PropTypeEditorComponent,
	PropTypeEditorProps,
} from './types';
import FacetPropEditorSkeleton from './FacetPropEditorSkeleton';

require('./facetEditor.scss');

function getPropSourceInfo<Prop extends FacetProp>(
	prop: Prop,
	currentScope: FacetSourceScope,
	cascadeResult: FacetPropCascadeResult<Prop>,
): FacetPropSourceInfo {
	const { sources } = cascadeResult;
	const contributingScopes = sources
		.filter((s) => s.value !== null || s.scope.kind === 'root')
		.map((s) => s.scope);
	const lowestContributingScope = contributingScopes[contributingScopes.length - 1];
	const isValueLocal = lowestContributingScope?.id === currentScope.id;
	if (prop.cascade === 'overwrite') {
		return {
			isValueLocal,
			contributingScopes,
		};
	}
	throw new FacetCascadeNotImplError(prop.cascade);
}

function GenericFacetEditor<Def extends FacetDefinition>(props: GenericFacetEditorProps<Def>) {
	const {
		cascadeResult,
		currentScope,
		description,
		facetDefinition,
		onUpdateValue,
		propEditors,
		displayStyle = 'settings',
		selfContained,
		isPersisting,
	} = props;
	const { props: cascadedProps, value: facetValue } = cascadeResult;
	const { name, label } = facetDefinition;
	const isCompact = displayStyle === 'compact';

	const renderPropEditor = useCallback(
		(key, prop: FacetProp) => {
			const { propType } = prop;
			const PropEditor: PropTypeEditorComponent<any> = propEditors[key]!;
			const propCascadeResult = cascadedProps[key];
			const { value } = propCascadeResult;

			const propSourceInfo = getPropSourceInfo(prop, currentScope, propCascadeResult);
			const onUpdatePropValue = (newValue) => onUpdateValue({ [key]: newValue } as any);

			const renderProps: PropTypeEditorProps<any> = {
				value,
				prop,
				propType,
				facetValue,
				propSourceInfo,
				onUpdateValue: onUpdatePropValue,
			};

			return (
				<FacetPropEditorSkeleton
					key={key}
					displayStyle={selfContained ? 'compact' : displayStyle}
					label={prop.label}
					onReset={() => onUpdatePropValue(null)}
					propSourceInfo={propSourceInfo}
				>
					<PropEditor key={key} {...renderProps} />
				</FacetPropEditorSkeleton>
			);
		},
		[
			propEditors,
			cascadedProps,
			currentScope,
			facetValue,
			onUpdateValue,
			displayStyle,
			selfContained,
		],
	);

	const propEditorsByName = mapFacet(facetDefinition, renderPropEditor);

	return (
		<SettingsSection
			gradient
			title={label ?? name}
			compact={isCompact}
			className={classNames('facet-editor-component', selfContained && 'self-contained')}
			description={description}
			controls={isPersisting && selfContained && <Spinner size={20} />}
		>
			<div className="prop-editors">{Object.values(propEditorsByName)}</div>
		</SettingsSection>
	);
}

export default GenericFacetEditor;
