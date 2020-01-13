import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDebounce } from 'use-debounce';

import { apiFetch } from 'utils';
import { SimpleEditor, PubNoteContent } from 'components';
import { usePubData } from 'containers/Pub/pubHooks';

import { ControlsButton, ControlsButtonGroup } from './ControlsButton';

require('./controls.scss');

const propTypes = {
	onClose: PropTypes.func.isRequired,
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

const ControlsFootnoteCitation = (props) => {
	const { editorChangeObject, onClose, pendingAttrs } = props;
	const { selectedNode } = editorChangeObject;
	const { citations = [] } = usePubData();
	const isFootnote = selectedNode.type.name === 'footnote';
	const existingCitation = !isFootnote && citations[selectedNode.attrs.count - 1];
	const { commitChanges, hasPendingChanges, updateAttrs: rawUpdateAttrs, attrs } = pendingAttrs;
	const { structuredValue, unstructuredValue } = unwrapPendingAttrs(attrs, isFootnote);
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
				initialHtmlString={unstructuredValue}
				onChange={(htmlString) => {
					updateAttrs({ unstructuredValue: htmlString });
				}}
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
						<ControlsButton disabled={!hasPendingChanges} onClick={handleUpdate}>
							Update {selectedNode.type.name}
						</ControlsButton>
					</ControlsButtonGroup>
				</div>
			)}
		</div>
	);
};

ControlsFootnoteCitation.propTypes = propTypes;
export default ControlsFootnoteCitation;
