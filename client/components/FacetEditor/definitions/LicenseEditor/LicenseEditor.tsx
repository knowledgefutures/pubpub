import { License } from 'facets';

import { createFacetKindEditor } from '../../createFacetKindEditor';
import LicenseKindPicker from './LicenseKindPicker';
import CopyrightSelectionPicker from './CopyrightSelectionPicker';

export default createFacetKindEditor(License, {
	propEditors: {
		kind: LicenseKindPicker,
		copyrightSelection: CopyrightSelectionPicker,
	},
});
