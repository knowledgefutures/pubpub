import { License } from 'facets';

import { createFacetKindEditor } from '../../createFacetKindEditor';
import LicenseKindPicker from './LicenseKindPicker';
import CopyrightSelectionPicker from './CopyrightSelectionPicker';

export default createFacetKindEditor(License, {
	propEditors: {
		// @ts-expect-error FIXME: LicensKindPicker has `FacetPropEditorProps<..., Nullable=false>`, while propEditors[string] expects nullable `true`
		kind: LicenseKindPicker,
		// @ts-expect-error FIXME: CopyrightSelectionPicker has `FacetPropEditorProps<..., Nullable=false>`, while propEditors[string] expects nullable `true`
		copyrightSelection: CopyrightSelectionPicker,
	},
});
