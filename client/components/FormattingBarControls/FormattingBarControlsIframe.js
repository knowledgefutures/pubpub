import React from 'react';
import PropTypes from 'prop-types';
import { Slider, ButtonGroup, Button } from '@blueprintjs/core';
import SimpleEditor from 'components/SimpleEditor/SimpleEditor';
import Icon from 'components/Icon/Icon';

const propTypes = {
	attrs: PropTypes.object.isRequired,
	updateAttrs: PropTypes.func.isRequired,
	isSmall: PropTypes.bool.isRequired,
};

const FormattingBarControlsIframe = (props)=> {
	const alignOptions = [
		{ key: 'left', icon: 'align-left' },
		{ key: 'center', icon: 'align-center' },
		{ key: 'right', icon: 'align-right' },
		{ key: 'full', icon: 'vertical-distribution' },
	];
	const iconSize = props.isSmall ? 12 : 16;

	return (
		<div className={`formatting-bar-controls-component ${props.isSmall ? 'small' : ''}`}>
			{/*  Size Adjustment */}
			<div className="block hide-on-small">
				<div className="label">Size</div>
				<div className="input">
					<Slider
						min={25}
						max={100}
						value={props.attrs.size}
						onChange={(newSize)=> {
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
						value={props.attrs.height}
						onChange={(newHeight)=> {
							props.updateAttrs({ height: newHeight });
						}}
						labelRenderer={false}
					/>
				</div>
			</div>

			{/*  Alignment Adjustment */}
			<div className="block hide-on-small">
				<div className="label">Alignment</div>
				<div className="input">
					<ButtonGroup>
						{alignOptions.map((item)=> {
							return (
								<Button
									key={item.key}
									icon={<Icon icon={item.icon} iconSize={iconSize} />}
									minimal={true}
									active={props.attrs.align === item.key}
									onClick={()=> { props.updateAttrs({ align: item.key }); }}
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
							onChange={(htmlString)=> {
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
						onChange={(evt)=>{
							props.updateAttrs({ url: evt.target.value });
						}}
						placeholder="Enter URL..."
					/>
				</div>
			</div>
		</div>
	);
};

FormattingBarControlsIframe.propTypes = propTypes;
export default FormattingBarControlsIframe;
