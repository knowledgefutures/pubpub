import type { Facet } from 'facets';

import type { FacetPropEditorProps } from '../../types';

import React from 'react';

import { ColorInput } from 'components';
import { calculateBackgroundColor } from 'utils/colors';
import { usePageContext } from 'utils/hooks';

import BackgroundColorChoice from './BackgroundColorChoice';

import './backgroundColorPicker.scss';

type Props = FacetPropEditorProps<Facet<'PubHeaderTheme'>, 'backgroundColor'>;

const BackgroundColorPicker = (props: Props) => {
	const { value, onUpdateValue } = props;
	const { communityData } = usePageContext();

	const hasCustomBackgroundColor =
		!!value && value !== 'community' && value !== 'dark' && value !== 'light';

	return (
		<div className="background-color-picker-component">
			<BackgroundColorChoice
				label="Light"
				color={calculateBackgroundColor('light')}
				onClick={() => onUpdateValue('light')}
				selected={value === 'light'}
			/>
			<BackgroundColorChoice
				label="Community accent"
				color={calculateBackgroundColor('community', communityData.accentColorDark)}
				onClick={() => onUpdateValue('community')}
				selected={value === 'community'}
			/>
			<BackgroundColorChoice
				label="Dark"
				color={calculateBackgroundColor('dark')}
				onClick={() => onUpdateValue('dark')}
				selected={value === 'dark'}
			/>
			<ColorInput
				value={hasCustomBackgroundColor ? value! : 'black'}
				onChange={(color) => {
					const { r, g, b, a } = color.rgb;
					const colorString = `rgba(${r},${g},${b},${a})`;
					onUpdateValue(colorString);
				}}
			>
				{(color) => (
					<BackgroundColorChoice
						label="Custom"
						color={color}
						selected={hasCustomBackgroundColor}
					/>
				)}
			</ColorInput>
		</div>
	);
};

export default BackgroundColorPicker;
