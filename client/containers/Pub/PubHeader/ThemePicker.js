import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Color from 'color';
import { Button } from 'reakit';

import { ColorInput, ImageUpload } from 'components';
import PubHeaderBackground from './PubHeaderBackground';
import { calculateBackgroundColor } from './colors';

require('./themePicker.scss');

const propTypes = {};

const TextStyleChoice = React.forwardRef(
	({ label, className, onClick, selected, style, pubData, communityData }, ref) => {
		return (
			<Button
				className={classNames('text-style-choice')}
				onClick={onClick}
				ref={ref}
				title={label}
			>
				<PubHeaderBackground
					pubData={pubData}
					communityData={communityData}
					blur={true}
					className={classNames(
						'example',
						className,
						'selectable',
						selected && 'selected',
					)}
					style={style || {}}
				>
					<div className="example-text">Aa</div>
				</PubHeaderBackground>
				<div className="label">{label}</div>
			</Button>
		);
	},
);

const TintChoice = React.forwardRef(({ label, onClick, color, selected }, ref) => {
	return (
		<Button className="tint-choice" onClick={onClick} ref={ref} title={label}>
			<div className="example">
				<div className="transparency" />
				<div
					className={classNames('inner', 'selectable', selected && 'selected')}
					style={{ backgroundColor: color }}
				/>
			</div>
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

const ThemePicker = (props) => {
	const { updateLocalData, pubData, communityData } = props;
	const { headerBackgroundColor, headerBackgroundImage, headerStyle } = pubData;

	const updatePubBackgroundColor = (color) => {
		updateLocalData('pub', {
			headerBackgroundColor: color,
		});
	};

	const updatePubHeaderStyle = (style) => {
		updateLocalData('pub', {
			headerStyle: style,
		});
	};

	const updatePubHeaderImage = (image) => {
		updateLocalData('pub', {
			headerBackgroundImage: image,
		});
	};

	const hasCustomBackgroundColor =
		headerBackgroundColor &&
		headerBackgroundColor !== 'community' &&
		headerBackgroundColor !== 'dark' &&
		headerBackgroundColor !== 'transparent';

	return (
		<div className="theme-picker-component">
			<div className="section">
				<div className="title">Background image</div>
				<ImageUpload
					defaultImage={headerBackgroundImage}
					onNewImage={updatePubHeaderImage}
					width={150}
					canClear={true}
					helperText={<span>Suggested minimum dimensions: 1200px x 800px.</span>}
				/>
			</div>
			<div className="section">
				<div className="title">Background tint</div>
				<div className="section-row">
					<TintChoice
						label="None"
						onClick={() => updatePubBackgroundColor('transparent')}
						selected={!headerBackgroundColor || headerBackgroundColor === 'transparent'}
					/>
					<TintChoice
						label="Community accent color"
						color={calculateBackgroundColor('community', communityData.accentColorDark)}
						onClick={() => updatePubBackgroundColor('community')}
						selected={headerBackgroundColor === 'community'}
					/>
					<TintChoice
						label="Dark"
						color={calculateBackgroundColor('dark')}
						onClick={() => updatePubBackgroundColor('dark')}
						selected={headerBackgroundColor === 'dark'}
					/>
					<ColorInput
						value={hasCustomBackgroundColor ? headerBackgroundColor : 'black'}
						onChange={(color) => {
							const { r, g, b, a } = color.rgb;
							const colorString = `rgba(${r},${g},${b},${a})`;
							updatePubBackgroundColor(colorString);
						}}
					>
						{(color) => (
							<TintChoice
								label="Custom"
								className="light"
								color={color}
								selected={hasCustomBackgroundColor}
							/>
						)}
					</ColorInput>
				</div>
			</div>
			<div className="section">
				<div className="title">Text style</div>
				<div className="section-row">
					<TextStyleChoice
						pubData={pubData}
						communityData={communityData}
						label="Light"
						className="light"
						onClick={() => updatePubHeaderStyle('light')}
						selected={!headerStyle || headerStyle === 'light'}
					/>
					<TextStyleChoice
						pubData={pubData}
						communityData={communityData}
						label="Dark"
						className="dark"
						onClick={() => updatePubHeaderStyle('dark')}
						selected={headerStyle === 'dark'}
					/>
					<TextStyleChoice
						pubData={pubData}
						communityData={communityData}
						label="White Blocks"
						className="white-blocks"
						onClick={() => updatePubHeaderStyle('white-blocks')}
						selected={headerStyle === 'white-blocks'}
					/>
					<TextStyleChoice
						pubData={pubData}
						communityData={communityData}
						label="Black Blocks"
						className="black-blocks"
						onClick={() => updatePubHeaderStyle('black-blocks')}
						selected={headerStyle === 'black-blocks'}
					/>
				</div>
			</div>
		</div>
	);
};

ThemePicker.propTypes = propTypes;
export default ThemePicker;
