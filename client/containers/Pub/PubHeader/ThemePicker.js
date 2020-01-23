import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit';
import { Card } from '@blueprintjs/core';

import { ColorInput } from 'components';

require('./themePicker.scss');

const propTypes = {};

const TextStyleChoice = React.forwardRef(({ label, className, onClick, selected, style }, ref) => {
	console.log(style);
	return (
		<Button
			className={classNames('text-style-choice', selected && 'selected')}
			onClick={onClick}
			ref={ref}
			title={label}
		>
			<div className={classNames('example', className)} style={style || {}}>
				Aa
			</div>
			<div className="label">{label}</div>
		</Button>
	);
});

const TintChoice = React.forwardRef(({ label, onClick, color, className, selected }, ref) => {
	return (
		<Button
			className={classNames('tint-choice', selected && 'selected')}
			onClick={onClick}
			ref={ref}
			title={label}
		>
			<div className={classNames('example', className)} style={{ backgroundColor: color }} />
			<div className="label">{label}</div>
		</Button>
	);
});

const setBackgroundTypeImage = (backgroundType, hasImage) => {
	switch (backgroundType) {
		case 'color':
		case 'color-and-image':
			return hasImage ? 'color-and-image' : 'color';
		case 'image':
		default:
			return hasImage ? 'image' : null;
	}
};

const setBackgroundTypeColor = (backgroundType, hasColor) => {
	switch (backgroundType) {
		case 'image':
		case 'color-and-image':
			return hasColor ? 'color-and-image' : 'image';
		case 'color':
		default:
			return hasColor ? 'color' : null;
	}
};

const ThemePicker = React.forwardRef((props, ref) => {
	const { updateLocalData, pubData, communityData } = props;
	const { headerBackgroundColor } = pubData;

	console.log(headerBackgroundColor);

	const updatePubBackgroundColor = (color) => {
		updateLocalData('pub', {
			headerBackgroundColor: color,
		});
	};

	return (
		<Card className="theme-picker-component" elevation={2}>
			<div className="section">
				<div className="title">Background image</div>
			</div>
			<div className="section">
				<div className="title">Background tint</div>
				<div className="row">
					<TintChoice
						label="None"
						className="transparency"
						onClick={() => updatePubBackgroundColor(null)}
						selected={!headerBackgroundColor}
					/>
					<TintChoice
						label="Community accent color"
						color={communityData.accentColorDark}
						onClick={() => updatePubBackgroundColor('community')}
						selected={headerBackgroundColor === 'community'}
					/>
					<ColorInput
						value={headerBackgroundColor || 'black'}
						presetColors={(rest) => [
							...rest,
							communityData.accentColorDark,
							communityData.accentColorLight,
							"black",
							"white",
						]}
						onChange={(color) => updatePubBackgroundColor(color.hex)}
					>
						{(color) => (
							<TintChoice
								label="Custom"
								className="light"
								color={color}
								selected={
									headerBackgroundColor && headerBackgroundColor !== 'community'
								}
							/>
						)}
					</ColorInput>
				</div>
			</div>
			<div className="section">
				<div className="title">Text style</div>
				<div className="row">
					<TextStyleChoice
						label="Light"
						className="light"
						style={{
							backgroundColor: headerBackgroundColor,
						}}
					/>
					<TextStyleChoice
						label="Dark"
						className="dark"
						style={{
							backgroundColor: headerBackgroundColor,
						}}
					/>
					<TextStyleChoice label="White Blocks" className="white-blocks" />
					<TextStyleChoice label="Black Blocks" className="black-blocks" />
				</div>
			</div>
		</Card>
	);
});

ThemePicker.propTypes = propTypes;
export default ThemePicker;
