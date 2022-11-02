import React from 'react';

import { Facet } from 'facets';
import { ImageUpload } from 'components';

import { FacetPropEditorProps } from '../../types';

require('./backgroundColorPicker.scss');

type Props = FacetPropEditorProps<Facet<'PubHeaderTheme'>, 'backgroundColor'>;

const BackgroundImagePicker = (props: Props) => {
	const { value, onUpdateValue } = props;
	return (
		<ImageUpload
			key={value}
			defaultImage={value!}
			onNewImage={onUpdateValue}
			width={150}
			canClear={true}
			helperText={
				<span>
					Suggested minimum dimensions: <br />
					1200px x 800px
				</span>
			}
		/>
	);
};

export default BackgroundImagePicker;
