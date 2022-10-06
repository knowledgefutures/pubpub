import { PubHeaderTheme } from 'facets';

import { createFacetEditor } from '../../createFacetEditor';
import BackgroundColorPicker from './BackgroundColorPicker';
import BackgroundImagePicker from './BackgroundImagePicker';
import TextStylePicker from './TextStylePicker';

export default createFacetEditor(PubHeaderTheme, {
	propEditors: {
		backgroundImage: BackgroundImagePicker,
		backgroundColor: BackgroundColorPicker,
		textStyle: TextStylePicker,
	},
});
