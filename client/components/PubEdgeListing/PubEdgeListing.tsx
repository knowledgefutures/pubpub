import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import { NonIdealState } from '@blueprintjs/core';

import { unique } from 'utils/arrays';
import { getDisplayedPubForPubEdge } from 'utils/pubEdge';
import { PubPageData } from 'types';

import { Filter, Mode, allFilters } from './constants';
import PubEdgeListingCard from './PubEdgeListingCard';
import PubEdgeListingCounter from './PubEdgeListingCounter';
import PubEdgeListingControls from './PubEdgeListingControls';

require('./pubEdgeListing.scss');

type Props = {
	accentColor: string;
	className?: string;
	hideIfNoInitialMatches?: boolean;
	isolated?: boolean;
	pubData: PubPageData;
	initialMode?: string;
	initialFilters?: string[];
	pubEdgeDescriptionIsVisible: boolean;
};

const edgeUniqueFingerprint = (pubEdgeInContext, assertIsUnique) => {
	const { edge, isSibling, isInboundEdge } = pubEdgeInContext;
	const displayedPub = getDisplayedPubForPubEdge(edge, {
		isInboundEdge,
		viewingFromSibling: isSibling,
	});
	if (displayedPub) {
		return displayedPub.id;
	}
	return assertIsUnique;
};

const collateAndFilterPubEdges = (filters, pubData) => {
	const { inboundEdges, outboundEdges, siblingEdges } = pubData;
	const includeParents = filters.includes(Filter.Parent);
	const includeChildren = filters.includes(Filter.Child);
	const includeSiblings = filters.includes(Filter.Sibling);
	const filteredPubEdges: any[] = [];
	const parentEdgesInContext: any[] = [];
	const childEdgesInContext: any[] = [];
	const siblingEdgesInContext: any[] = [];

	outboundEdges.forEach((edge) => {
		const { pubIsParent } = edge;
		const included = pubIsParent ? includeChildren : includeParents;
		const edgeInContext = {
			isSibling: false,
			isInboundEdge: false,
			edge,
		};
		if (included) {
			filteredPubEdges.push(edgeInContext);
		}
		if (pubIsParent) {
			childEdgesInContext.push(edgeInContext);
		} else {
			parentEdgesInContext.push(edgeInContext);
		}
	});

	inboundEdges.forEach((edge) => {
		const { pubIsParent } = edge;
		const included = pubIsParent ? includeParents : includeChildren;
		const edgeInContext = {
			isSibling: false,
			isInboundEdge: true,
			edge,
		};
		if (included) {
			filteredPubEdges.push(edgeInContext);
		}
		if (pubIsParent) {
			parentEdgesInContext.push(edgeInContext);
		} else {
			childEdgesInContext.push(edgeInContext);
		}
	});

	siblingEdges.forEach((edge) => {
		const { pubIsParent, pub, targetPub } = edge;
		const edgeInContext = {
			isSibling: true,
			isInboundEdge: false,
			edge,
			parentPub: pubIsParent ? pub : targetPub,
		};
		siblingEdgesInContext.push(edgeInContext);
		if (includeSiblings) {
			filteredPubEdges.push(edgeInContext);
		}
	});

	return {
		filteredPubEdgesInContext: unique(filteredPubEdges, edgeUniqueFingerprint),
		collatedPubEdgesInContext: unique(
			[...parentEdgesInContext, ...childEdgesInContext, ...siblingEdgesInContext],
			edgeUniqueFingerprint,
		),
	};
};

const PubEdgeListing = (props: Props) => {
	const {
		accentColor,
		className = '',
		hideIfNoInitialMatches = true,
		initialMode = Mode.Carousel,
		initialFilters = [Filter.Child],
		isolated = false,
		pubData,
		pubEdgeDescriptionIsVisible,
	} = props;
	const [index, setIndex] = useState(0);
	const [mode, setMode] = useState(initialMode);
	const [filters, setFilters] = useState(initialFilters);

	const { filteredPubEdgesInContext, collatedPubEdgesInContext } = collateAndFilterPubEdges(
		filters,
		pubData,
	);

	const [initiallyRenderEmpty] = useState(
		hideIfNoInitialMatches && filteredPubEdgesInContext.length === 0,
	);
	const { [index]: activeEdgeInContext, length } = filteredPubEdgesInContext;

	const next = useCallback(() => setIndex((i) => (i + 1) % length), [length]);
	const back = useCallback(() => setIndex((i) => (i - 1 + length) % length), [length]);

	const onFilterToggle = useCallback((filter) => {
		setFilters((currentFilters) => {
			const filterIndex = currentFilters.indexOf(filter);

			if (filterIndex > -1) {
				return [
					...currentFilters.slice(0, filterIndex),
					...currentFilters.slice(filterIndex + 1),
				];
			}
			return [...currentFilters, filter];
		});
		setIndex(0);
	}, []);

	const onAllFilterToggle = useCallback(() => {
		setFilters((currentFilters) =>
			currentFilters.length === Object.keys(Filter).length ? [] : allFilters,
		);
		setIndex(0);
	}, []);

	const disableCarouselControls = filteredPubEdgesInContext.length === 1;
	const showControls =
		collatedPubEdgesInContext.length > 1 && (!isolated || filteredPubEdgesInContext.length > 1);

	const controls = showControls && (
		<>
			<PubEdgeListingCounter index={index} count={length} />
			<PubEdgeListingControls
				accentColor={accentColor}
				carouselControlsDisabled={disableCarouselControls}
				single={filteredPubEdgesInContext.length === 1}
				filters={filters}
				mode={mode}
				onAllFilterToggle={onAllFilterToggle}
				onBackClick={back}
				onFilterToggle={onFilterToggle}
				onModeChange={setMode}
				onNextClick={next}
				showFilterMenu={!isolated}
			/>
		</>
	);

	const renderContent = () => {
		return (
			!isolated && (
				<div className="top">
					<h5 style={{ color: accentColor }}>Connections</h5>
					{controls}
				</div>
			)
		);
	};

	const renderCards = () => {
		const cards =
			mode === Mode.Carousel
				? activeEdgeInContext && (
						<PubEdgeListingCard
							pubEdgeDescriptionIsVisible={pubEdgeDescriptionIsVisible}
							pubEdge={activeEdgeInContext.edge}
							parentPub={activeEdgeInContext.parentPub}
							accentColor={accentColor}
							showIcon={isolated}
							viewingFromSibling={activeEdgeInContext.isSibling}
							isInboundEdge={activeEdgeInContext.isInboundEdge}
							inPubBody
						>
							{isolated && controls}
						</PubEdgeListingCard>
				  )
				: filteredPubEdgesInContext.map(({ isInboundEdge, edge, isSibling, parentPub }) => (
						<PubEdgeListingCard
							pubEdgeDescriptionIsVisible={pubEdgeDescriptionIsVisible}
							key={edge.url}
							pubEdge={edge}
							parentPub={parentPub}
							accentColor={accentColor}
							viewingFromSibling={isSibling}
							isInboundEdge={isInboundEdge}
							inPubBody
						/>
				  ));

		return !isolated && (!activeEdgeInContext || filteredPubEdgesInContext.length === 0) ? (
			<NonIdealState title="No Results" icon="search" />
		) : (
			cards
		);
	};

	if (initiallyRenderEmpty) {
		return null;
	}

	return (
		<div className={classNames('pub-edge-listing-component', className)}>
			{renderContent()}
			{renderCards()}
		</div>
	);
};

export default PubEdgeListing;
