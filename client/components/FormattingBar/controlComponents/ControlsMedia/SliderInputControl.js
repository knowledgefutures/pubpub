import React from 'react';
import PropTypes from 'prop-types';
import { NumericInput, Slider } from '@blueprintjs/core';

const propTypes = {
	disabled: PropTypes.bool,
	leftLabel: PropTypes.node.isRequired,
	maxValue: PropTypes.number.isRequired,
	minValue: PropTypes.number.isRequired,
	onChange: PropTypes.func.isRequired,
	rightLabel: PropTypes.node.isRequired,
	value: PropTypes.number.isRequired,
	'aria-label': PropTypes.string.isRequired,
};

const defaultProps = {
	disabled: false,
};

const SliderInputControl = (props) => {
	const {
		disabled,
		leftLabel,
		maxValue,
		minValue,
		onChange,
		rightLabel,
		value,
		'aria-label': ariaLabel,
	} = props;

	const sliderPositionToValue = (p) => {
		return Math.round(minValue + (p / 100) * (maxValue - minValue));
	};

	const valueToSliderPosition = (v) => {
		return (100 * (v - minValue)) / (maxValue - minValue);
	};

	const clampValue = (v) => Math.max(minValue, Math.min(maxValue, v));

	return (
		<div className="slider-input-control">
			<div className="left-label">{leftLabel}</div>
			<Slider
				min={0}
				max={100}
				stepSize={1}
				value={valueToSliderPosition(value)}
				onChange={(position) => onChange(sliderPositionToValue(position))}
				labelRenderer={false}
				disabled={disabled}
			/>
			<NumericInput
				value={value}
				min={minValue}
				max={maxValue}
				stepSize={10}
				buttonPosition="none"
				disabled={disabled}
				aria-label={ariaLabel}
				clampValueOnBlur={true}
				onBlur={(evt) => {
					const nextValue = parseInt(evt.target.value, 10);
					if (!Number.isNaN(nextValue)) {
						onChange(clampValue(nextValue));
					}
				}}
			/>
			<div className="right-label">{rightLabel}</div>
		</div>
	);
};

SliderInputControl.propTypes = propTypes;
SliderInputControl.defaultProps = defaultProps;
export default SliderInputControl;
