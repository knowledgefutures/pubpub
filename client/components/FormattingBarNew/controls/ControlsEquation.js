/* eslint-disable react/no-danger */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Icon } from '@blueprintjs/core';
import { useDebounce } from 'use-debounce';

import { renderLatexString } from 'utils';

import { useCommitAttrs } from './useCommitAttrs';
import { ControlsButton, ControlsButtonGroup } from './ControlsButton';

require('./controls.scss');

const propTypes = {
	isSmall: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	onPendingChanges: PropTypes.func.isRequired,
	editorChangeObject: PropTypes.shape({
		changeNode: PropTypes.func.isRequired,
		updateNode: PropTypes.func.isRequired,
		selectedNode: PropTypes.shape({
			type: PropTypes.shape({
				name: PropTypes.string,
			}),
			attrs: PropTypes.shape({
				value: PropTypes.string.isRequired,
				html: PropTypes.string,
			}),
		}),
	}).isRequired,
};

const getSchemaDefinitionForNodeType = (editorChangeObject, nodeTypeName) => {
	return editorChangeObject.view.state.schema.nodes[nodeTypeName];
};

const ControlsEquation = (props) => {
	const { editorChangeObject, onPendingChanges, onClose, isSmall } = props;
	const { changeNode, selectedNode, updateNode } = editorChangeObject;
	const {
		commitChanges,
		revertChanges,
		hasPendingChanges,
		updateAttrs,
		pendingAttrs,
	} = useCommitAttrs(selectedNode.attrs, updateNode, onPendingChanges);
	const { value, html } = pendingAttrs;
	const [debouncedValue] = useDebounce(value, 250);
	const isBlock = selectedNode.type.name === 'block_equation';
	const iconSize = isSmall ? 12 : 16;

	useEffect(() => {
		renderLatexString(debouncedValue, false, (nextHtml) => {
			updateAttrs({ html: nextHtml });
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedValue, isBlock]);

	const handleUpdate = () => {
		commitChanges();
		onClose();
	};

	const handleChangeNodeType = () => {
		const targetNodeType = isBlock ? 'equation' : 'block_equation';
		const schemaDefinition = getSchemaDefinitionForNodeType(editorChangeObject, targetNodeType);
		commitChanges();
		changeNode(schemaDefinition, { value: value, html: html }, null);
	};

	return (
		<div className="controls-equation-component">
			<div className="section" key="structured">
				<textarea
					className="latex"
					placeholder="Enter LaTeX"
					value={value}
					onChange={(evt) => updateAttrs({ value: evt.target.value })}
				/>
			</div>
			{html && (
				<div className="section preview">
					<div className="title">Preview</div>
					<div className="preview" dangerouslySetInnerHTML={{ __html: html }} />
					<ControlsButtonGroup>
						<ControlsButton onClick={handleChangeNodeType}>
							Change to {isBlock ? 'inline' : 'block'}
						</ControlsButton>
						<ControlsButton disabled={!hasPendingChanges} onClick={revertChanges}>
							Revert
						</ControlsButton>
						<ControlsButton disabled={!hasPendingChanges} onClick={handleUpdate}>
							Update equation
						</ControlsButton>
					</ControlsButtonGroup>
				</div>
			)}
		</div>
	);
};

ControlsEquation.propTypes = propTypes;
export default ControlsEquation;
