import React, { useCallback } from 'react';
import { RadioGroup, Radio } from '@blueprintjs/core';

import { FacetPropType, TypeOfFacetPropType } from 'facets';
import { PropTypeEditorProps } from '../types';

type RadioItem<T> = {
	value: T;
	label: string;
};

type Options<T extends FacetPropType> = {
	items: RadioItem<TypeOfFacetPropType<T>>[];
};

type Props = PropTypeEditorProps<FacetPropType>;

export const radio = <T extends FacetPropType>(options: Options<T>) => {
	const { items } = options;
	return (props: Props) => {
		const { value, onUpdateValue } = props;
		const selectedRadioValue = items.findIndex((item) => item.value === value).toString();

		const handleSelectRadioValue = useCallback(
			(radioValue: string) => {
				const item = items[parseInt(radioValue, 10)];
				onUpdateValue(item.value);
			},
			[onUpdateValue],
		);

		const handleSelectNewValue = useCallback(
			(evt: any) => {
				handleSelectRadioValue(evt.target.value);
			},
			[handleSelectRadioValue],
		);

		const handleChooseAlreadySelectedValue = useCallback(
			(evt: any) => {
				if (evt.target.value === selectedRadioValue) {
					handleSelectRadioValue(evt.target.value);
				}
			},
			[handleSelectRadioValue, selectedRadioValue],
		);

		return (
			<RadioGroup onChange={handleSelectNewValue} selectedValue={selectedRadioValue}>
				{items.map((choice, index) => (
					<Radio
						key={choice.value}
						label={choice.label}
						value={index.toString()}
						onClick={handleChooseAlreadySelectedValue}
					/>
				))}
			</RadioGroup>
		);
	};
};
