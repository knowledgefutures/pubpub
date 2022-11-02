import React, { useMemo } from 'react';

import { primitives } from 'facets';
import { MenuSelect, MenuSelectItem } from 'components/Menu';

import { PropTypeEditorProps, PropTypeEditorComponent } from '../types';

type ChoicePropType = ReturnType<typeof primitives.choice>;
type ChoiceValue<PropType extends ChoicePropType> = PropType['extension']['values'][number];

type ChoiceItems<PropType extends ChoicePropType> = Record<
	ChoiceValue<PropType>,
	MenuSelectItem<ChoiceValue<PropType>>
>;

type Options<PropType extends ChoicePropType> = {
	items: Partial<ChoiceItems<PropType>>;
};

type Props = PropTypeEditorProps<ChoicePropType>;

const getMenuItems = <PropType extends ChoicePropType>(
	values: string[],
	items: Partial<ChoiceItems<PropType>>,
): MenuSelectItem<ChoiceValue<PropType>>[] => {
	return values.map((value) => {
		const item = items[value] ?? { label: value };
		return { value, ...item };
	});
};

export const dropdown = <PropType extends ChoicePropType>(
	options: Options<PropType>,
): PropTypeEditorComponent<PropType> => {
	const { items } = options;
	return (props: Props) => {
		const { value, onUpdateValue, propType, prop } = props;
		const { values } = propType.extension;
		const menuItems = useMemo(() => getMenuItems(values, items), [values]);

		return (
			<MenuSelect
				aria-label={`Select value for prop (${prop.label})`}
				items={menuItems}
				value={value}
				onSelectValue={onUpdateValue}
			/>
		);
	};
};
