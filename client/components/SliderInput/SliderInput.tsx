import React from 'react';
import { NumericInput, Slider, ISliderProps } from '@blueprintjs/core';

require('./sliderInput.scss');

type ValueCallback = (value: number, commited: boolean) => unknown;

type Props = {
	'aria-label': string;
	disabled?: boolean;
	inputStepSize?: number;
	labelRenderer?: ISliderProps['labelRenderer'];
	labelStepSize?: ISliderProps['labelStepSize'];
	leftLabel?: React.ReactNode;
	max: number;
	min: number;
	onChange: ValueCallback;
	rightLabel?: React.ReactNode;
	sliderStepSize?: number;
	value: number;
};

const SliderInputControl = (props: Props) => {
	const {
		'aria-label': ariaLabel,
		disabled = false,
		inputStepSize = 10,
		labelRenderer = false,
		labelStepSize,
		leftLabel = null,
		max,
		min,
		onChange,
		rightLabel = null,
		sliderStepSize = 1,
		value,
	} = props;

	const reportTextInput = (
		evt: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>,
	) => {
		const { value: evtValue } = evt.target as HTMLInputElement;
		const nextValue = parseInt(evtValue, 10);
		const clampedValue = Math.max(min, Math.min(max, nextValue));
		if (!Number.isNaN(nextValue)) {
			onChange(clampedValue, true);
		}
	};

	return (
		<div className="slider-input-component">
			<div className="left-label">{leftLabel}</div>
			<Slider
				min={min}
				max={max}
				stepSize={sliderStepSize}
				value={value}
				onChange={(v) => onChange(v, false)}
				onRelease={(v) => onChange(v, true)}
				labelRenderer={labelRenderer}
				disabled={disabled}
				labelStepSize={labelStepSize}
			/>
			<NumericInput
				value={value}
				min={min}
				max={max}
				stepSize={inputStepSize}
				buttonPosition="none"
				disabled={disabled}
				aria-label={ariaLabel}
				clampValueOnBlur={true}
				onKeyDown={(evt) => {
					if (evt.key === 'Enter') {
						reportTextInput(evt);
					}
				}}
				onBlur={reportTextInput}
			/>
			<div className="right-label">{rightLabel}</div>
		</div>
	);
};

export default SliderInputControl;
