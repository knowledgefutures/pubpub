import React from 'react';
import PropTypes from 'prop-types';

import { ColorInput, ImageUpload } from 'components';
import { calculateBackgroundColor } from 'utils/colors';

import TextStyleChoice from './TextStyleChoice';
import TintStyleChoice from './TintStyleChoice';

require('./pubThemePicker.scss');

// Preload background image for tint picker
if (typeof Image !== 'undefined') {
	new Image().src = '/static/transparency.png';
}

const propTypes = {
	updatePubData: PropTypes.func.isRequired,
	pubData: PropTypes.object.isRequired,
	communityData: PropTypes.shape({
		accentColorDark: PropTypes.string,
	}).isRequired,
};

const ThemePicker = (props) => {
	const { updatePubData, pubData, communityData } = props;
	const { headerBackgroundColor, headerBackgroundImage, headerStyle } = pubData;

	const updatePubBackgroundColor = (color) =>
		updatePubData({
			headerBackgroundColor: color,
		});

	const updatePubHeaderStyle = (style) =>
		updatePubData({
			headerStyle: style,
		});

	const updatePubHeaderImage = (image) =>
		updatePubData({
			headerBackgroundImage: image,
		});

	const hasCustomBackgroundColor =
		headerBackgroundColor &&
		headerBackgroundColor !== 'community' &&
		headerBackgroundColor !== 'dark' &&
		headerBackgroundColor !== 'light';

	return (
		<div className="theme-picker-component">
			<div className="section">
				<div className="title">Background image</div>
				<ImageUpload
					key={headerBackgroundImage}
					defaultImage={headerBackgroundImage}
					onNewImage={updatePubHeaderImage}
					width={150}
					canClear={true}
					helperText={
						<span>
							Suggested minimum dimensions: <br />
							1200px x 800px
						</span>
					}
				/>
			</div>
			<div className="section">
				<div className="title">Background tint</div>
				<div className="section-row">
					<TintStyleChoice
						label="Light"
						color={calculateBackgroundColor('light')}
						onClick={() => updatePubBackgroundColor('light')}
						selected={headerBackgroundColor === 'light'}
					/>
					<TintStyleChoice
						label="Community accent color"
						color={calculateBackgroundColor('community', communityData.accentColorDark)}
						onClick={() => updatePubBackgroundColor('community')}
						selected={headerBackgroundColor === 'community'}
					/>
					<TintStyleChoice
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
							<TintStyleChoice
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
