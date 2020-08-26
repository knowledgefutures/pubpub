import React from 'react';

import { ColorInput, ImageUpload } from 'components';
import { calculateBackgroundColor } from 'utils/colors';

import TextStyleChoice from './TextStyleChoice';
import TintStyleChoice from './TintStyleChoice';

require('./pubThemePicker.scss');

// Preload background image for tint picker
if (typeof Image !== 'undefined') {
	new Image().src = '/static/transparency.png';
}

type Props = {
	updatePubData: (...args: any[]) => any;
	pubData: any;
	communityData: {
		accentColorDark?: string;
	};
};

const ThemePicker = (props: Props) => {
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
					// @ts-expect-error ts-migrate(2322) FIXME: Type '(image: any) => any' is not assignable to ty... Remove this comment to see the full error message
					onNewImage={updatePubHeaderImage}
					width={150}
					canClear={true}
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'undefine... Remove this comment to see the full error message
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
						// @ts-expect-error ts-migrate(2322) FIXME: Property 'label' does not exist on type 'Intrinsic... Remove this comment to see the full error message
						label="Light"
						color={calculateBackgroundColor('light')}
						onClick={() => updatePubBackgroundColor('light')}
						selected={headerBackgroundColor === 'light'}
					/>
					<TintStyleChoice
						// @ts-expect-error ts-migrate(2322) FIXME: Property 'label' does not exist on type 'Intrinsic... Remove this comment to see the full error message
						label="Community accent color"
						color={calculateBackgroundColor('community', communityData.accentColorDark)}
						onClick={() => updatePubBackgroundColor('community')}
						selected={headerBackgroundColor === 'community'}
					/>
					<TintStyleChoice
						// @ts-expect-error ts-migrate(2322) FIXME: Property 'label' does not exist on type 'Intrinsic... Remove this comment to see the full error message
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
								// @ts-expect-error ts-migrate(2322) FIXME: Property 'label' does not exist on type 'Intrinsic... Remove this comment to see the full error message
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
						// @ts-expect-error ts-migrate(2322) FIXME: Property 'pubData' does not exist on type 'Intrins... Remove this comment to see the full error message
						pubData={pubData}
						communityData={communityData}
						label="Light"
						className="light"
						onClick={() => updatePubHeaderStyle('light')}
						selected={!headerStyle || headerStyle === 'light'}
					/>
					<TextStyleChoice
						// @ts-expect-error ts-migrate(2322) FIXME: Property 'pubData' does not exist on type 'Intrins... Remove this comment to see the full error message
						pubData={pubData}
						communityData={communityData}
						label="Dark"
						className="dark"
						onClick={() => updatePubHeaderStyle('dark')}
						selected={headerStyle === 'dark'}
					/>
					<TextStyleChoice
						// @ts-expect-error ts-migrate(2322) FIXME: Property 'pubData' does not exist on type 'Intrins... Remove this comment to see the full error message
						pubData={pubData}
						communityData={communityData}
						label="White Blocks"
						className="white-blocks"
						onClick={() => updatePubHeaderStyle('white-blocks')}
						selected={headerStyle === 'white-blocks'}
					/>
					<TextStyleChoice
						// @ts-expect-error ts-migrate(2322) FIXME: Property 'pubData' does not exist on type 'Intrins... Remove this comment to see the full error message
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
export default ThemePicker;
