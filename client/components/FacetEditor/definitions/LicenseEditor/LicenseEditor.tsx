import { License } from 'facets';

import { createFacetEditor } from '../../createFacetEditor';
import LicenseKindPicker from './LicenseKindPicker';
import CopyrightSelectionPicker from './CopyrightSelectionPicker';

export default createFacetEditor(License, {
	propEditors: {
		kind: LicenseKindPicker,
		copyrightSelection: CopyrightSelectionPicker,
	},
});
