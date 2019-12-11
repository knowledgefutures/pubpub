import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDebounce } from 'use-debounce';

import { apiFetch } from 'utils';
import { SimpleEditor, PubNoteContent } from 'components';
import { usePubData } from 'containers/Pub/pubHooks';
import { useValuesChanged } from './useValuesChanged';

require('./controls.scss');

const propTypes = {
	updateNodeAttrs: PropTypes.func.isRequired,
	onPendingChanges: PropTypes.func.isRequired,
	nodeAttrs: PropTypes.shape({
		count: PropTypes.number.isRequired,
		unstructuredValue: PropTypes.string.isRequired,
		value: PropTypes.string.isRequired,
		html: PropTypes.string,
	}).isRequired,
};

const ControlsCitation = (props) => {
	const { updateNodeAttrs, nodeAttrs, onPendingChanges } = props;
	const { citations = [] } = usePubData();
	const existingCitation = citations[nodeAttrs.count - 1];
	const [structuredValue, setStructuredValue] = useState(nodeAttrs.value);
	const [structuredHtml, setStructuredHtml] = useState(existingCitation && existingCitation.html);
	const [unstructuredValue, setUnstructuredValue] = useState(nodeAttrs.unstructuredValue);
	const [debouncedStructuredValue] = useDebounce(structuredValue, 250);
	const [debouncedUnstructuredValue] = useDebounce(unstructuredValue, 250);
	const hasChanges = useValuesChanged([unstructuredValue, structuredValue]);

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
			<div className="section">
				<div className="title">Rich Text</div>
				<SimpleEditor
					initialHtmlString={unstructuredValue}
					onChange={(htmlString) => setUnstructuredValue(htmlString)}
				/>
			</div>
			<div className="section">
				<div className="title">Preview</div>
				<PubNoteContent structured={structuredHtml} unstructured={unstructuredValue} />
			</div>
		</div>
	);
};

ControlsCitation.propTypes = propTypes;
export default ControlsCitation;
