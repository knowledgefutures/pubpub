import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

import { SimpleEditor, PubNoteContent } from 'components';
import { getCitationInlineLabel } from 'components/Editor/utils/citation';
import { usePubContext } from 'containers/Pub/pubHooks';

import { ControlsButton, ControlsButtonGroup } from '../ControlsButton';
import InlineLabelEditor from './InlineLabelEditor';

require('../controls.scss');

type Props = {
	onClose: (...args: any[]) => any;
	pendingAttrs: any;
	editorChangeObject: {
		updateNode: (...args: any[]) => any;
		selectedNode?: {
			type?: {
				name?: string;
			};
			attrs?: {
				count?: number;
				unstructuredValue: string;
				value: string;
				html?: string;
			};
		};
	};
};

const unwrapPendingAttrs = (pendingAttrs, isFootnote) => {
	const { structuredValue, unstructuredValue, value, ...restValues } = pendingAttrs;
	if (isFootnote) {
		return {
			...restValues,
			unstructuredValue: value,
			structuredValue,
		};
	}
	return {
		...restValues,
		structuredValue: value,
		unstructuredValue,
	};
};

const wrapUpdateAttrs = (updateAttrs, isFootnote) => {
	return (attrsUpdate) => {
		const { structuredValue, unstructuredValue, ...restValues } = attrsUpdate;
		const result = { ...restValues };
		if ('structuredValue' in attrsUpdate) {
			result[isFootnote ? 'structuredValue' : 'value'] = structuredValue;
		}
		if ('unstructuredValue' in attrsUpdate) {
			result[isFootnote ? 'value' : 'unstructuredValue'] = unstructuredValue;
		}
		return updateAttrs(result);
	};
};

const ControlsFootnoteCitation = (props: Props) => {
	const { editorChangeObject, onClose, pendingAttrs } = props;
	const { selectedNode } = editorChangeObject;
	const { citationManager } = usePubContext();
	// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
	const isFootnote = selectedNode.type.name === 'footnote';
	const { commitChanges, hasPendingChanges, updateAttrs: rawUpdateAttrs, attrs } = pendingAttrs;
	const { structuredValue, unstructuredValue, customLabel } = unwrapPendingAttrs(
		attrs,
		isFootnote,
	);
	const updateAttrs = wrapUpdateAttrs(rawUpdateAttrs, isFootnote);
	const [citation, setCitation] = useState(citationManager.getSync(structuredValue));
	const [debouncedValue] = useDebounce(structuredValue, 250);
	const html = citation && citation.html;
	const showPreview = html || unstructuredValue;

	useEffect(() => {
		const unsubscribe = citationManager.subscribe(debouncedValue, setCitation);
		return unsubscribe;
	}, [debouncedValue, citationManager]);

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

	const renderInlineStyleControls = () => {
		if (isFootnote) {
			return null;
		}

		const defaultLabel = getCitationInlineLabel({
			...selectedNode,
			// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
			attrs: { ...selectedNode.attrs, citation, customLabel },
		});

		return (
			<>
				<div className="title">Inline format</div>
				<InlineLabelEditor
					defaultLabel={defaultLabel}
					customLabel={customLabel}
					onUpdateCustomLabel={(label) => updateAttrs({ customLabel: label })}
				/>
			</>
		);
	};

	return (
		<div className="controls-citation-component">
			{inputSections}
			{showPreview && (
				<div className="section preview">
					<div className="title">Preview</div>
					<PubNoteContent structured={html} unstructured={unstructuredValue} />
					{!isFootnote && renderInlineStyleControls()}
					<ControlsButtonGroup>
						<ControlsButton disabled={!hasPendingChanges} onClick={handleUpdate}>
							{/* @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'. */}
							Update {selectedNode.type.name}
						</ControlsButton>
					</ControlsButtonGroup>
				</div>
			)}
		</div>
	);
};
export default ControlsFootnoteCitation;
