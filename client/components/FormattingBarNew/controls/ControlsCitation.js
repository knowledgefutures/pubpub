import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDebounce } from 'use-debounce';

import { apiFetch } from 'utils';
import { SimpleEditor, PubNoteContent } from 'components';
import { usePubData } from 'containers/Pub/pubHooks';
import { useValuesChanged } from './useValuesChanged';
import { ControlsButton, ControlsButtonGroup } from './ControlsButton';

require('./controls.scss');

const propTypes = {
	onClose: PropTypes.func.isRequired,
	onPendingChanges: PropTypes.func.isRequired,
	editorChangeObject: PropTypes.shape({
		updateNode: PropTypes.func.isRequired,
		selectedNode: PropTypes.shape({
			attrs: PropTypes.shape({
				count: PropTypes.number.isRequired,
				unstructuredValue: PropTypes.string.isRequired,
				value: PropTypes.string.isRequired,
				html: PropTypes.string,
			}),
		}),
	}).isRequired,
};

const ControlsCitation = (props) => {
	const { editorChangeObject, onPendingChanges, onClose } = props;
	const {
		updateNode,
		selectedNode: { attrs },
	} = editorChangeObject;
	const { citations = [] } = usePubData();
	const existingCitation = citations[attrs.count - 1];
	const [structuredValue, setStructuredValue] = useState(attrs.value);
	const [structuredHtml, setStructuredHtml] = useState(existingCitation && existingCitation.html);
	const [revertedAt, setRevertedAt] = useState(Date.now());
	const [unstructuredValue, setUnstructuredValue] = useState(attrs.unstructuredValue);
	const [debouncedStructuredValue] = useDebounce(structuredValue, 250);
	const [debouncedUnstructuredValue] = useDebounce(unstructuredValue, 250);
	const hasChanges = useValuesChanged([unstructuredValue, structuredValue]);
	const showPreview = structuredHtml || unstructuredValue;

	useEffect(() => {
		apiFetch('/api/editor/citation-format', {
			method: 'POST',
			body: JSON.stringify({
				data: [
					{
						structuredValue: debouncedStructuredValue,
						unstructuredValue: debouncedUnstructuredValue,
					},
				],
			}),
		}).then(([result]) => setStructuredHtml(result.html));
	}, [debouncedStructuredValue, debouncedUnstructuredValue]);

	useEffect(() => onPendingChanges(hasChanges), [hasChanges, onPendingChanges]);

	const handleRevert = () => {
		setStructuredValue(attrs.value);
		setUnstructuredValue(attrs.unstructuredValue);
		setStructuredHtml(existingCitation && existingCitation.html);
		setRevertedAt(Date.now());
	};

	const handleUpdate = () => {
		updateNode({
			value: structuredValue,
			unstructuredValue: unstructuredValue,
		});
		onClose();
	};

	return (
		<div className="controls-citation-component">
			<div className="section">
				<div className="title">Structured Data</div>
				<textarea
					className="structured-data"
					placeholder="Enter bibtex, DOI, wikidata url, or bibjson..."
					value={structuredValue}
					onChange={(evt) => setStructuredValue(evt.target.value)}
				/>
			</div>
			<div className="section hide-overflow">
				<div className="title">Rich Text</div>
				<SimpleEditor
					key={revertedAt}
					initialHtmlString={unstructuredValue}
					onChange={(htmlString) => setUnstructuredValue(htmlString)}
				/>
			</div>
			{showPreview && (
				<div className="section preview">
					<div className="title">Preview:</div>
					<PubNoteContent structured={structuredHtml} unstructured={unstructuredValue} />
					<ControlsButtonGroup>
						<ControlsButton disabled={!hasChanges} onClick={handleRevert}>
							Revert
						</ControlsButton>
						<ControlsButton disabled={!hasChanges} onClick={handleUpdate}>
							Update citation
						</ControlsButton>
					</ControlsButtonGroup>
				</div>
			)}
		</div>
	);
};

ControlsCitation.propTypes = propTypes;
export default ControlsCitation;
