import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Slider, NumericInput, ButtonGroup, Button } from '@blueprintjs/core';
import SimpleEditor from 'components/SimpleEditor/SimpleEditor';
import Icon from 'components/Icon/Icon';

const propTypes = {
	attrs: PropTypes.object.isRequired,
	updateAttrs: PropTypes.func.isRequired,
	isSmall: PropTypes.bool.isRequired,
};

const ControlsIframe = (props) => {
	const alignOptions = [
		{ key: 'left', icon: 'align-left' },
		{ key: 'center', icon: 'align-center' },
		{ key: 'right', icon: 'align-right' },
		{ key: 'full', icon: 'vertical-distribution' },
		{ key: 'breakout', icon: 'fullscreen' },
	];
	const iconSize = props.isSmall ? 12 : 16;
	const [heightStringVal, setHeightStringVal] = useState(props.attrs.height);

	return (
		<div className={`formatting-bar_controls-component ${props.isSmall ? 'small' : ''}`}>
			{/*  Size Adjustment */}
			<div className="block hide-on-small">
				<div className="label">Size</div>
				<div className="input">
					<Slider
						min={20}
						max={100}
						value={props.attrs.size}
						onChange={(newSize) => {
							props.updateAttrs({ size: newSize });
						}}
						labelRenderer={false}
						disabled={props.attrs.align === 'full'}
					/>
				</div>
			</div>

			{/*  Height Adjustment */}
			<div className="block">
				<div className="label">Height</div>
				<div className="input">
					<Slider
						min={150}
						max={800}
						stepSize={10}
						value={Math.max(Math.min(800, props.attrs.height), 150)}
						onChange={(newHeight) => {
							setHeightStringVal(newHeight);
							props.updateAttrs({ height: newHeight });
						}}
						labelRenderer={false}
					/>
				</div>
				<div className="input">
					<NumericInput
						value={heightStringVal}
						stepSize={10}
						clampValueOnBlur={true}
						min={50}
						minorStepSize={1}
						majorStepSize={100}
						buttonPosition="none"
						rightElement={<div className="input-suffix">pixels</div>}
						onValueChange={(newVal, newValString) => {
							setHeightStringVal(newValString);
							if (newVal >= 50) {
								props.updateAttrs({ height: newVal });
							}
						}}
					/>
				</div>
			</div>

			{/*  Alignment Adjustment */}
			<div className="block hide-on-small">
				<div className="label">Alignment</div>
				<div className="input">
					<ButtonGroup>
						{alignOptions.map((item) => {
							return (
								<Button
									key={item.key}
									icon={<Icon icon={item.icon} iconSize={iconSize} />}
									minimal={true}
									active={props.attrs.align === item.key}
									onClick={() => {
										props.updateAttrs({ align: item.key });
									}}
								/>
							);
						})}
					</ButtonGroup>
				</div>
			</div>

			{/*  Caption Adjustment */}
			<div className="block">
				<div className="label">Caption</div>
				<div className="input wide">
					<div className="simple-editor-wrapper">
						<SimpleEditor
							initialHtmlString={props.attrs.caption}
							onChange={(htmlString) => {
								props.updateAttrs({ caption: htmlString });
							}}
							placeholder="Enter caption..."
						/>
					</div>
				</div>
			</div>

			{/*  Source Details */}
			<div className="block">
				<div className="label">Source</div>
				<div className="input wide">
					<input
						type="text"
						className={`bp3-input bp3-fill ${props.isSmall ? 'bp3-small' : ''}`}
						value={props.attrs.url}
						onChange={(evt) => {
							props.updateAttrs({ url: evt.target.value });
						}}
						placeholder="Enter URL..."
					/>
				</div>
			</div>
		</div>
	);
};

ControlsIframe.propTypes = propTypes;
export default ControlsIframe;
