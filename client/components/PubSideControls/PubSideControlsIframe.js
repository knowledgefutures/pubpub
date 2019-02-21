import React from 'react';
import PropTypes from 'prop-types';
import { Slider } from '@blueprintjs/core';
import SimpleEditor from 'components/SimpleEditor/SimpleEditor';

const propTypes = {
	attrs: PropTypes.object.isRequired,
	updateAttrs: PropTypes.func.isRequired,
};

const PubSideControlsIframe = (props) => {
	const alignOptions = [
		{ key: 'left', icon: 'bp3-icon-align-left' },
		{ key: 'center', icon: 'bp3-icon-align-center' },
		{ key: 'right', icon: 'bp3-icon-align-right' },
		{ key: 'full', icon: 'bp3-icon-vertical-distribution' },
	];
	return (
		<div className="pub-side-controls-iframe-component">
			<div className="options-title">Iframe Details</div>
			{/*  Size Adjustment */}
			<div className="form-label first">Size</div>
			<Slider
				min={25}
				max={100}
				value={props.attrs.size}
				onChange={(newSize) => {
					props.updateAttrs({ size: newSize });
				}}
				labelRenderer={false}
				disabled={props.attrs.align === 'full'}
			/>

			{/*  Height Adjustment */}
			<div className="form-label">Height</div>
			<Slider
				min={150}
				max={800}
				value={props.attrs.height}
				onChange={(newHeight) => {
					props.updateAttrs({ height: newHeight });
				}}
				labelRenderer={false}
			/>

			{/*  Alignment Adjustment */}
			<div className="form-label">Alignment</div>
			<div className="bp3-button-group bp3-fill">
				{alignOptions.map((item) => {
					return (
						<button
							key={`align-option-${item.key}`}
							type="button"
							className={`bp3-button ${item.icon} ${
								props.attrs.align === item.key ? 'bp3-active' : ''
							}`}
							onClick={() => {
								props.updateAttrs({ align: item.key });
							}}
						/>
					);
				})}
			</div>

			{/*  Caption Adjustment */}
			<div className="form-label">Caption</div>
			<div className="simple-editor-wrapper">
				<SimpleEditor
					initialHtmlString={props.attrs.caption}
					onChange={(htmlString) => {
						props.updateAttrs({ caption: htmlString });
					}}
					placeholder="Enter caption..."
				/>
			</div>

			{/*  Source Details */}
			<div className="form-label">Source</div>
			<textarea
				className="bp3-input bp3-fill"
				value={props.attrs.url}
				onChange={(evt) => {
					props.updateAttrs({ url: evt.target.value });
				}}
				placeholder="Enter URL..."
			/>
		</div>
	);
};

PubSideControlsIframe.propTypes = propTypes;
export default PubSideControlsIframe;
