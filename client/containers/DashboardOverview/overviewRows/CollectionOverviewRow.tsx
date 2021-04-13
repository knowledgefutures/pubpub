import React, { useCallback } from 'react';
import classNames from 'classnames';
import { Button } from '@blueprintjs/core';

import { Icon } from 'client/components';
import { getDashUrl } from 'utils/dashboard';
import { Collection } from 'utils/types';
import { usePageContext } from 'utils/hooks';
import { capitalize } from 'utils/strings';
import { getSchemaForKind } from 'utils/collections/schemas';

import { iconSize } from './constants';
import OverviewRowSkeleton from './OverviewRowSkeleton';

require('./collectionOverviewRow.scss');

type Props = {
	className?: string;
	collection: Collection;
	isOpen?: boolean;
	isLoading?: boolean;
	onToggleOpen?: () => unknown;
};

const getPublicStateLabel = (collection: Collection) => {
	const { isPublic } = collection;
	if (isPublic) {
		return {
			label: 'Public Collection',
			icon: 'globe' as const,
		};
	}
	return {
		label: 'Private Collection',
		icon: 'lock2' as const,
	};
};

const CollectionOverviewRow = React.forwardRef((props: Props, ref: any) => {
	const { className, collection, isOpen, onToggleOpen, isLoading } = props;
	const { title, slug } = collection;

	const { communityData } = usePageContext();
	const schema = getSchemaForKind(collection.kind)!;

	const onButtonClick = useCallback(
		(e: React.MouseEvent<any>) => {
			if (onToggleOpen) {
				onToggleOpen();
				e.stopPropagation();
			}
		},
		[onToggleOpen],
	);

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
			iconLabelPairs={[
				{ ...getPublicStateLabel(collection), className: 'public-private-indicator' },
				{
					label: capitalize(schema.label.singular),
					icon: schema.bpDisplayIcon,
				},
			]}
			withHoverEffect={!isOpen}
			rightElement={toggleButton}
			ref={ref}
		/>
	);
});

export default CollectionOverviewRow;
