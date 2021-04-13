import React from 'react';
import { Button } from 'reakit/Button';
import { Spinner } from '@blueprintjs/core';

import { Icon } from 'components';

import SpecialRow from './SpecialRow';

require('./loadMorePubsRow.scss');

type Props = {
	isLoading: boolean;
	isDark?: boolean;
	onClick?: () => unknown;
};

const LoadMorePubsRow = (props: Props) => {
	const { isLoading, isDark, onClick } = props;

	return (
		<Button
			as={SpecialRow as any}
			onClick={onClick}
			isDark={isDark}
			className="load-more-pubs-row-component"
			disabled={isLoading}
		>
			{!isLoading && <Icon icon="chevron-down" iconSize={18} />}
			{isLoading && <Spinner size={14} />}
			<span className="label">{isLoading ? 'Loading Pubs...' : 'Load more Pubs'}</span>
		</Button>
	);
};

export default LoadMorePubsRow;
