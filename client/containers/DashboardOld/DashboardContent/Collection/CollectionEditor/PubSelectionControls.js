/**
 * A component that renders a card for an indivudal pub that's been selected in the
 * CollectionsEditor (and so lives in the right-side pane). It renders a PubRow with more controls.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Button, ControlGroup, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';

import { pubDataProps } from 'types/pub';
import { getSchemaForKind } from 'shared/collections/schemas';

const propTypes = {
	onRemove: PropTypes.func.isRequired,
	onSetContext: PropTypes.func.isRequired,
	pubSelection: PropTypes.shape({
		pub: pubDataProps.isRequired,
		collection: PropTypes.shape({
			kind: PropTypes.string,
		}),
		contextHint: PropTypes.shape({
			label: PropTypes.string.isRequired,
		}).isRequired,
	}).isRequired,
};

const PubSelectionControls = ({ onRemove, onSetContext, pubSelection }) => {
	const availableContextHints = getSchemaForKind(pubSelection.collection.kind).contextHints;
	return (
		<ControlGroup>
			{availableContextHints.length > 0 && (
				<Select
					items={[{ value: null, label: 'None' }].concat(availableContextHints)}
					itemRenderer={(hint, { handleClick }) => (
						<MenuItem onClick={handleClick} key={hint.value} text={hint.label} />
					)}
					filterable={false}
					popoverProps={{ minimal: true }}
					onItemSelect={onSetContext}
				>
					<Button minimal>
						<em>{(pubSelection.contextHint || {}).label || 'Use as...'}</em>
					</Button>
				</Select>
			)}
			<Button
				minimal
				icon="cross"
				aria-label="Remove pub from selections"
				onClick={onRemove}
			/>
		</ControlGroup>
	);
};

PubSelectionControls.propTypes = propTypes;

export default PubSelectionControls;
