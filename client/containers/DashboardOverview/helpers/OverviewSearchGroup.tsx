import React, { useState, useCallback } from 'react';
import classNames from 'classnames';

import { Icon } from 'components';

require('./overviewSearchGroup.scss');

type SearchTermCallback = (q: string) => unknown;

type Props = {
	placeholder: string;
	onUpdateSearchTerm?: SearchTermCallback;
	onCommitSearchTerm?: SearchTermCallback;
	rightControls?: React.ReactNode;
};

const OverviewSearchGroup = (props: Props) => {
	const { placeholder, onCommitSearchTerm, onUpdateSearchTerm, rightControls } = props;
	const [isSearchFocused, setIsSearchFocused] = useState(false);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const { value } = e.target as HTMLInputElement;
			if (onUpdateSearchTerm) {
				onUpdateSearchTerm(value);
			}
		},
		[onUpdateSearchTerm],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			const { value } = e.target as HTMLInputElement;
			if (e.key === 'Enter' && onCommitSearchTerm) {
				onCommitSearchTerm(value);
			}
		},
		[onCommitSearchTerm],
	);

	return (
		<div
			className={classNames(
				'overview-search-group-component',
				isSearchFocused && 'search-focused',
			)}
		>
			<Icon icon="search" className="search-icon" iconSize={16} />
			<input
				placeholder={placeholder}
				onFocus={() => setIsSearchFocused(true)}
				onBlur={() => setIsSearchFocused(false)}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
			/>
			{rightControls && <div className="right-controls">{rightControls}</div>}
		</div>
	);
};

export default OverviewSearchGroup;
