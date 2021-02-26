import React, { useState } from 'react';
import { RadioGroup, Radio } from '@blueprintjs/core';

import { SliderInput } from 'components';
import { maxPubsPerBlock } from 'utils/layout';

type Props = {
	limit?: number;
	onChangeLimit: (nextLimit: undefined | number) => unknown;
};

const defaultCustomLimit = 10;

const LimitPubs = (props: Props) => {
	const { limit, onChangeLimit } = props;
	const [intermediateLimit, setIntermediateLimit] = useState(limit || defaultCustomLimit);

	const handleRadioSelect = (value: string) => {
		if (value === 'all') {
			onChangeLimit(undefined);
		} else {
			onChangeLimit(defaultCustomLimit);
			setIntermediateLimit(defaultCustomLimit);
		}
	};

	const handleChange = (value: number, committed: boolean) => {
		setIntermediateLimit(value);
		if (committed) {
			onChangeLimit(value);
		}
	};

	return (
		<div className="layout-editor-pubs_limit-pubs-component">
			<RadioGroup
				onChange={(evt) => handleRadioSelect(evt.currentTarget.value)}
				selectedValue={limit ? 'limit' : 'all'}
			>
				<Radio value="all" label={`Show up to ${maxPubsPerBlock} Pubs`} />
				<Radio
					value="limit"
					labelElement={
						<>
							Limit shown Pubs
							{!!limit && (
								<SliderInput
									aria-label="Number of Pubs to display"
									min={1}
									max={maxPubsPerBlock}
									onChange={handleChange}
									value={intermediateLimit}
									labelStepSize={maxPubsPerBlock - 1}
								/>
							)}
						</>
					}
				/>
			</RadioGroup>
		</div>
	);
};

export default LimitPubs;
