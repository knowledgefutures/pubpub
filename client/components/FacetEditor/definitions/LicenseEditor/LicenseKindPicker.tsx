import type { License } from 'facets';

import type { FacetPropEditorProps } from '../../types';

import React, { useMemo } from 'react';

import { MenuSelect, type MenuSelectItem } from 'components/Menu';
import { usePageContext } from 'utils/hooks';
import { licenseDetailsByKind } from 'utils/licenses';

type Props = FacetPropEditorProps<typeof License, 'kind', false>;

const LicenseKindPicker = (props: Props) => {
	const { value, onUpdateValue } = props;
	const {
		communityData: { premiumLicenseFlag },
	} = usePageContext();

	const menuItems: MenuSelectItem<Props['value']>[] = useMemo(() => {
		return Object.values(licenseDetailsByKind)
			.filter((license) => {
				if (license.requiresPremium && !premiumLicenseFlag) {
					return false;
				}
				return true;
			})
			.map((license) => {
				return {
					value: license.kind as any,
					label: license.short,
					icon: <img width={75} alt="" src={`/static/license/${license.kind}.svg`} />,
				};
			});
	}, [premiumLicenseFlag]);

	return (
		<MenuSelect
			aria-label="Choose a license"
			value={value}
			items={menuItems}
			onSelectValue={onUpdateValue}
			showTickIcon={false}
		/>
	);
};

export default LicenseKindPicker;
