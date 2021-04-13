import React, { useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import Color from 'color';

import { Collection } from 'utils/types';
import { useManyPubs } from 'client/utils/useManyPubs';
import { useSticky, isSticky } from 'client/utils/useSticky';
import { usePageContext } from 'utils/hooks';

import CollectionOverviewRow from './CollectionOverviewRow';
import OverviewRows from './OverviewRows';
import PubOverviewRow from './PubOverviewRow';
import LoadMorePubsRow from './LoadMorePubsRow';
import SpecialRow from './SpecialRow';

require('./expandableCollectionOverviewRow.scss');

type Props = {
	collection: Collection;
};

// Global header + breadcrumbs - 1px top border of OverviewRowSkeleton
const breadcrumbsOffset = 56 + 85 - 1;

const ExpandableCollectionOverviewRow = (props: Props) => {
	const { collection } = props;
	const [isOpen, setIsOpen] = useState(false);
	const [targetScrollTop, setTargetScrollTop] = useState<null | number>(null);
	const { communityData } = usePageContext();
	const headerRef = useRef<null | HTMLElement>();

	const backgroundColor = useMemo(() => Color(communityData.accentColorDark).alpha(0.05), [
		communityData.accentColorDark,
	]);

	const {
		currentQuery: { pubs, loadMorePubs, hasLoadedAllPubs },
		allQueries: { isLoading },
	} = useManyPubs({
		isEager: false,
		batchSize: 100,
		query: {
			collectionIds: [collection.id],
			ordering: { field: 'collectionRank', direction: 'ASC' },
		},
	});

	const isExpanded = isOpen && pubs.length > 0;

	useSticky({
		target: headerRef.current!,
		isActive: isExpanded,
		offset: breadcrumbsOffset,
	});

	const handleToggleOpen = () => {
		const header = headerRef.current!;
		if (isOpen) {
			if (isSticky(header) && typeof targetScrollTop === 'number') {
				window.scrollTo({ top: targetScrollTop });
			}
		} else {
			const headerPageOffset = header.getBoundingClientRect().top + window.scrollY;
			setTargetScrollTop(headerPageOffset - breadcrumbsOffset);
			if (pubs.length === 0) {
				loadMorePubs();
			}
		}
		setIsOpen(!isOpen);
	};

	return (
		<>
			<CollectionOverviewRow
				className={classNames(
					'expandable-collection-overview-row-component',
					isExpanded && 'expanded',
				)}
				collection={collection}
				isOpen={isOpen}
				isLoading={isLoading && isOpen && !pubs.length}
				onToggleOpen={handleToggleOpen}
				ref={headerRef}
			/>
			{isOpen && (
				<OverviewRows style={{ backgroundColor }}>
					{pubs.map((pub) => (
						<PubOverviewRow pub={pub} key={pub.id} />
					))}
					{!hasLoadedAllPubs && pubs.length > 0 && (
						<LoadMorePubsRow isLoading={isLoading} onClick={loadMorePubs} isDark />
					)}
					{hasLoadedAllPubs && pubs.length === 0 && (
						<SpecialRow isDark>No Pubs in this Collection yet.</SpecialRow>
					)}
				</OverviewRows>
			)}
		</>
	);
};

export default ExpandableCollectionOverviewRow;
