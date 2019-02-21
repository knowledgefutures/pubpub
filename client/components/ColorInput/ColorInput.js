import React from 'react';
import PropTypes from 'prop-types';
import { Popover, PopoverInteractionKind, Position } from '@blueprintjs/core';
import { SketchPicker } from 'react-color';

require('./colorInput.scss');

const propTypes = {
	value: PropTypes.string.isRequired,
	onChange: PropTypes.func,
	onChangeComplete: PropTypes.func,
};

const defaultProps = {
	onChange: undefined,
	onChangeComplete: undefined,
};

const ColorInput = function(props) {
	return (
		<div className="color-input-component">
			<Popover
				content={
					<SketchPicker
						color={props.value}
						onChange={props.onChange}
						onChangeComplete={props.onChangeComplete}
						disableAlpha={true}
						presetColors={[
							'#c0392b',
							'#d35400',
							'#f39c12',
							'#16a085',
							'#27ae60',
							'#2980b9',
							'#8e44ad',
							'#2c3e50',
						]}
					/>
				}
				interactionKind={PopoverInteractionKind.CLICK}
				position={Position.BOTTOM}
				usePortal={false}
			>
				<div className="swatch" style={{ backgroundColor: props.value }} />
			</Popover>
		</div>
	);
};

ColorInput.propTypes = propTypes;
ColorInput.defaultProps = defaultProps;
export default ColorInput;
