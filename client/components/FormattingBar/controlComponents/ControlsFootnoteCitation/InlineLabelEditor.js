import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ControlGroup, InputGroup } from '@blueprintjs/core';

import { MenuButton, MenuItem } from 'components/Menu';

const propTypes = {
	customLabel: PropTypes.string.isRequired,
	defaultLabel: PropTypes.func.isRequired,
	onUpdateCustomLabel: PropTypes.func.isRequired,
};

const InlineLabelEditor = (props) => {
	const { customLabel, defaultLabel, onUpdateCustomLabel } = props;
	const [usingCustomLabel, setUsingCustomLabel] = useState(!!customLabel);
	const buttonLabel = usingCustomLabel ? 'Custom' : 'Pub default';

	const handleSelectDefault = () => {
		setUsingCustomLabel(false);
		onUpdateCustomLabel('');
	};

	const handleSelectCustom = () => {
		if (!customLabel) onUpdateCustomLabel(defaultLabel);
		setUsingCustomLabel(true);
	};

	return (
		<ControlGroup className="inline-label-editor-component">
			<MenuButton
				aria-label="Choose an inline label type"
				buttonProps={{
					minimal: true,
					rightIcon: 'chevron-down',
					className: 'label-type-menu',
				}}
				buttonContent={buttonLabel}
			>
				<MenuItem text="Pub default" onClick={handleSelectDefault} />
				<MenuItem text="Custom" onClick={handleSelectCustom} />
			</MenuButton>
			<InputGroup
				disabled={!usingCustomLabel}
				value={usingCustomLabel ? customLabel : defaultLabel}
				onChange={(evt) => onUpdateCustomLabel(evt.target.value)}
			/>
		</ControlGroup>
	);
};

InlineLabelEditor.propTypes = propTypes;
export default InlineLabelEditor;
