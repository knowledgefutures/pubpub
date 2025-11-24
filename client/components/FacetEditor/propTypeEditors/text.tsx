import type { primitives } from 'facets';

import type { PropTypeEditorProps } from '../types';

import React from 'react';

import { InputGroup } from '@blueprintjs/core';

type Props = PropTypeEditorProps<typeof primitives.string>;

export const text = () => {
	return (props: Props) => {
		const {
			value,
			onUpdateValue,
			propSourceInfo: { isValueLocal },
		} = props;
		return (
			<InputGroup
				value={(isValueLocal && value) || undefined}
				placeholder={(!isValueLocal && value) || undefined}
				onChange={(e) => onUpdateValue(e.target.value)}
			/>
		);
	};
};
