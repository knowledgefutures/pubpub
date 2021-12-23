import React, { useCallback } from 'react';
import classNames from 'classnames';
import { Button } from '@blueprintjs/core';

import { Icon } from 'client/components';
import { getDashUrl } from 'utils/dashboard';
import { Collection } from 'types';
import { usePageContext } from 'utils/hooks';

import { iconSize } from './constants';
import {
	getCollectionKindLabel,
	getCollectionPublicStateLabel,
	getScopeSummaryLabels,
	renderLabelPairs,
} from './labels';
import OverviewRowSkeleton from './OverviewRowSkeleton';

require('./collectionOverviewRow.scss');

type Props = {
	className?: string;
	collection: Collection;
	isOpen?: boolean;
	isLoading?: boolean;
	onToggleOpen?: () => unknown;
};

const CollectionOverviewRow = React.forwardRef((props: Props, ref: any) => {
	const { className, collection, isOpen, onToggleOpen, isLoading } = props;
	const { title, slug } = collection;

	const { communityData } = usePageContext();

	const onButtonClick = useCallback(
		(e: React.MouseEvent<any>) => {
			if (onToggleOpen) {
				onToggleOpen();
				e.stopPropagation();
			}
		},
		[onToggleOpen],
	);
	const iconLabelPairs = renderLabelPairs([
		...getScopeSummaryLabels(collection.scopeSummary!, true),
		getCollectionPublicStateLabel(collection),
		getCollectionKindLabel(collection),
	]);
	const toggleButton = (
		<Button
			aria-label={isOpen ? 'collapse Collection' : 'expand Collection'}
			onClick={onButtonClick}
			minimal
			icon={
				<Icon
					iconSize={iconSize}
					icon={isOpen ? 'collapse-all' : 'expand-all'}
					color={communityData.accentColorDark}
				/>
			}
			loading={isLoading}
		/>
	);
	return (
		<OverviewRowSkeleton
			onClick={onToggleOpen}
			className={classNames('collection-overview-row-component', className)}
			title={title}
			leftIcon="collection"
			href={getDashUrl({ collectionSlug: slug })}
			details={iconLabelPairs}
			withHoverEffect={!isOpen}
			rightElement={toggleButton}
			ref={ref}
		/>
	);
});

export default CollectionOverviewRow;
