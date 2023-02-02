import { PubHeaderTheme } from 'facets';

import { createFacetKindEditor } from '../../createFacetKindEditor';
import BackgroundColorPicker from './BackgroundColorPicker';
import BackgroundImagePicker from './BackgroundImagePicker';
import TextStylePicker from './TextStylePicker';

export default createFacetKindEditor(PubHeaderTheme, {
	propEditors: {
		backgroundImage: BackgroundImagePicker,
		backgroundColor: BackgroundColorPicker,
		textStyle: TextStylePicker,
	},
});
