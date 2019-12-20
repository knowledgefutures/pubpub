/* eslint-disable react/no-danger */
import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDebounce } from 'use-debounce';

import { renderLatexString } from 'utils';

import { useCommitAttrs } from './useCommitAttrs';
import { ControlsButton, ControlsButtonGroup } from './ControlsButton';

require('./controls.scss');

const propTypes = {
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
	const { editorChangeObject, onPendingChanges, onClose } = props;
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
	const hasMountedRef = useRef(false);
	const isBlock = selectedNode.type.name === 'block_equation';

	console.log(selectedNode);

	useEffect(() => {
		// Avoid an initial call to the server's LaTeX renderer on mount
		// We shouldn't need this anyway -- but moreover, it will sometimes produce HTML that is
		// insubstantially different from that given in our Prosemirror schema definitions, making
		// it appear as though there is a user-driven change to the node that needs to be committed
		// or reverted.
		if (!hasMountedRef.current) {
			hasMountedRef.current = true;
			return;
		}
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
