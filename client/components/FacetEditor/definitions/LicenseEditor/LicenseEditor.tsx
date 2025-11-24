import { License } from 'facets';

import { createFacetKindEditor } from '../../createFacetKindEditor';
import CopyrightSelectionPicker from './CopyrightSelectionPicker';
import LicenseKindPicker from './LicenseKindPicker';

export default createFacetKindEditor(License, {
	propEditors: {
		// @ts-expect-error FIXME: LicensKindPicker has `FacetPropEditorProps<..., Nullable=false>`, while propEditors[string] expects nullable `true`
		kind: LicenseKindPicker,
		// @ts-expect-error FIXME: CopyrightSelectionPicker has `FacetPropEditorProps<..., Nullable=false>`, while propEditors[string] expects nullable `true`
		copyrightSelection: CopyrightSelectionPicker,
	},
});
