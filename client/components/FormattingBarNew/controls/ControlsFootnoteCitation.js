import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDebounce } from 'use-debounce';

import { apiFetch } from 'utils';
import { SimpleEditor, PubNoteContent } from 'components';
import { usePubData } from 'containers/Pub/pubHooks';

import { useCommitAttrs } from './useCommitAttrs';
import { ControlsButton, ControlsButtonGroup } from './ControlsButton';

require('./controls.scss');

const propTypes = {
	onClose: PropTypes.func.isRequired,
	onPendingChanges: PropTypes.func.isRequired,
	editorChangeObject: PropTypes.shape({
		updateNode: PropTypes.func.isRequired,
		selectedNode: PropTypes.shape({
			type: PropTypes.shape({
				name: PropTypes.string,
			}),
			attrs: PropTypes.shape({
				count: PropTypes.number.isRequired,
				unstructuredValue: PropTypes.string.isRequired,
				value: PropTypes.string.isRequired,
				html: PropTypes.string,
			}),
		}),
	}).isRequired,
};

const unwrapPendingAttrs = (pendingAttrs, isFootnote) => {
	const { structuredValue, unstructuredValue, value } = pendingAttrs;
	if (isFootnote) {
		return {
			unstructuredValue: value,
			structuredValue: structuredValue,
		};
	}
	return {
		structuredValue: value,
		unstructuredValue: unstructuredValue,
	};
};

const wrapUpdateAttrs = (updateAttrs, isFootnote) => {
	return (attrsUpdate) => {
		const result = {};
		if ('structuredValue' in attrsUpdate) {
			result[isFootnote ? 'structuredValue' : 'value'] = attrsUpdate.structuredValue;
		}
		if ('unstructuredValue' in attrsUpdate) {
			result[isFootnote ? 'value' : 'unstructuredValue'] = attrsUpdate.unstructuredValue;
		}
		return updateAttrs(result);
	};
};

const ControlsCitation = (props) => {
	const { editorChangeObject, onPendingChanges, onClose } = props;
	const { updateNode, selectedNode } = editorChangeObject;
	const { citations = [] } = usePubData();
	const existingCitation = citations[selectedNode.attrs.count - 1];
	const {
		commitChanges,
		revertChanges,
		revertKey,
		hasPendingChanges,
		updateAttrs: rawUpdateAttrs,
		pendingAttrs,
	} = useCommitAttrs(selectedNode.attrs, updateNode, onPendingChanges);

	const isFootnote = selectedNode.type.name === 'footnote';
	const { structuredValue, unstructuredValue } = unwrapPendingAttrs(pendingAttrs, isFootnote);
	const updateAttrs = wrapUpdateAttrs(rawUpdateAttrs, isFootnote);

	const [html, setHtml] = useState(existingCitation && existingCitation.html);
	const [debouncedValue] = useDebounce(structuredValue, 250);
	const showPreview = html || unstructuredValue;

	useEffect(() => {
		apiFetch('/api/editor/citation-format', {
			method: 'POST',
			body: JSON.stringify({
				data: [
					{
						structuredValue: debouncedValue,
					},
				],
			}),
		}).then(([result]) => setHtml(result.html));
	}, [debouncedValue]);

	const handleRevert = () => {
		setHtml(existingCitation && existingCitation.html);
		revertChanges();
	};

	const handleUpdate = () => {
		commitChanges();
		onClose();
	};

	const structuredSection = (
		<div className="section" key="structured">
			<div className="title">Structured Data</div>
			<textarea
				className="structured-data"
				placeholder="Enter bibtex, DOI, wikidata url, or bibjson..."
				value={structuredValue}
				onChange={(evt) => updateAttrs({ structuredValue: evt.target.value })}
			/>
		</div>
	);

	const unstructuredSection = (
		<div className="section hide-overflow" key="unstructured">
			<div className="title">Rich Text</div>
			<SimpleEditor
				key={revertKey}
				initialHtmlString={unstructuredValue}
				onChange={(htmlString) => updateAttrs({ unstructuredValue: htmlString })}
			/>
		</div>
	);

	const inputSections = isFootnote
		? [unstructuredSection, structuredSection]
		: [structuredSection, unstructuredSection];

	return (
		<div className="controls-citation-component">
			{inputSections}
			{showPreview && (
				<div className="section preview">
					<div className="title">Preview</div>
					<PubNoteContent structured={html} unstructured={unstructuredValue} />
					<ControlsButtonGroup>
						<ControlsButton disabled={!hasPendingChanges} onClick={handleRevert}>
							Revert
						</ControlsButton>
						<ControlsButton disabled={!hasPendingChanges} onClick={handleUpdate}>
							Update {selectedNode.type.name}
						</ControlsButton>
					</ControlsButtonGroup>
				</div>
			)}
		</div>
	);
};

ControlsCitation.propTypes = propTypes;
export default ControlsCitation;
