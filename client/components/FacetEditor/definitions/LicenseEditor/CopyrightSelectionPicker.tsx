import React from 'react';
import { NumericInput, Radio, RadioGroup } from '@blueprintjs/core';

import { License } from 'facets';
import { FacetPropEditorProps } from '../../types';

require('./copyrightSelectionPicker.scss');

type Props = FacetPropEditorProps<typeof License, 'copyrightSelection', false>;

const currentYear = new Date().getFullYear();

const CopyrightSelectionPicker = (props: Props) => {
	const { value, onUpdateValue } = props;
	const { choice, year } = value;

	const handleChange = (next: Partial<Props['value']>) => {
		onUpdateValue({ ...value, ...next });
	};

	return (
		<>
			<RadioGroup
				className="copyright-selection-picker-component"
				selectedValue={choice}
				onChange={(e) => handleChange({ choice: (e.target as any).value })}
			>
				<Radio value="infer-from-scope">Infer copyright year from Pub and Collection</Radio>
				<Radio value="choose-here">Pick a specific year</Radio>
			</RadioGroup>
			<NumericInput
				min={0}
				disabled={choice !== 'choose-here'}
				value={year ?? currentYear}
				placeholder="1999"
				onValueChange={(nextYear) =>
					handleChange({
						choice: 'choose-here',
						year: nextYear,
					})
				}
			/>
		</>
	);
};

export default CopyrightSelectionPicker;
