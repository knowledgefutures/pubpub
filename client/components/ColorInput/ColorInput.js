import React from 'react';
import PropTypes from 'prop-types';
import { Popover, PopoverInteractionKind, Position } from '@blueprintjs/core';
import { SketchPicker } from 'react-color';

require('./colorInput.scss');

const propTypes = {
	value: PropTypes.string.isRequired,
	presetColors: PropTypes.arrayOf(PropTypes.string),
	onChange: PropTypes.func,
	onChangeComplete: PropTypes.func,
	children: PropTypes.func,
};

const defaultProps = {
	onChange: undefined,
	onChangeComplete: undefined,
	children: undefined,
	presetColors: undefined,
};

const defaultPresetColors = [
	'#c0392b',
	'#d35400',
	'#f39c12',
	'#16a085',
	'#27ae60',
	'#2980b9',
	'#8e44ad',
	'#2c3e50',
];

const ColorInput = function(props) {
	const presetColors = props.presetColors
		? typeof props.presetColors === 'function'
			? props.presetColors(defaultPresetColors)
			: props.presetColors
		: defaultPresetColors;
	return (
		<div className="color-input-component">
			<Popover
				content={
					<SketchPicker
						color={props.value}
						onChange={props.onChange}
						onChangeComplete={props.onChangeComplete}
						disableAlpha={false}
						presetColors={presetColors}
					/>
				}
				interactionKind={PopoverInteractionKind.CLICK}
				position={Position.BOTTOM}
				usePortal={false}
			>
				{typeof props.children === 'function' ? (
					props.children(props.value)
				) : (
					<div className="swatch" style={{ backgroundColor: props.value }} />
				)}
			</Popover>
		</div>
	);
};

ColorInput.propTypes = propTypes;
ColorInput.defaultProps = defaultProps;
export default ColorInput;
