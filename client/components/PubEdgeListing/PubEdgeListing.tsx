import { NonIdealState } from '@blueprintjs/core';
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';

import { Filter, Mode, allFilters } from './constants';
import PubEdgeListingCard from './PubEdgeListingCard';
import PubEdgeListingCounter from './PubEdgeListingCounter';
import PubEdgeListingControls from './PubEdgeListingControls';

require('./pubEdgeListing.scss');

type OwnProps = {
	accentColor: string;
	className?: string;
	hideIfNoInitialMatches?: boolean;
	isolated?: boolean;
	pubData: {
		inboundEdges: any[];
		outboundEdges: any[];
		siblingEdges: any[];
	};
	initialMode?: string;
	initialFilters?: string[];
};

const defaultProps = {
	className: '',
	hideIfNoInitialMatches: true,
	isolated: false,
	initialMode: Mode.Carousel,
	initialFilters: [Filter.Child],
};

const collateAndFilterPubEdges = (filters, pubData) => {
	const { inboundEdges, outboundEdges, siblingEdges } = pubData;
	const includeParents = filters.includes(Filter.Parent);
	const includeChildren = filters.includes(Filter.Child);
	const includeSiblings = filters.includes(Filter.Sibling);
	const filteredPubEdges = [];
	const parentEdgesInContext = [];
	const childEdgesInContext = [];
	const siblingEdgesInContext = [];

	outboundEdges.forEach((edge) => {
		const { pubIsParent } = edge;
		const included = pubIsParent ? includeChildren : includeParents;
		const edgeInContext = {
			isSibling: false,
			isInboundEdge: false,
			edge: edge,
		};
		if (included) {
			// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ isSibling: boolean; isInboundE... Remove this comment to see the full error message
			filteredPubEdges.push(edgeInContext);
		}
		if (pubIsParent) {
			// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ isSibling: boolean; isInboundE... Remove this comment to see the full error message
			childEdgesInContext.push(edgeInContext);
		} else {
			// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ isSibling: boolean; isInboundE... Remove this comment to see the full error message
			parentEdgesInContext.push(edgeInContext);
		}
	});

	inboundEdges.forEach((edge) => {
		const { pubIsParent } = edge;
		const included = pubIsParent ? includeParents : includeChildren;
		const edgeInContext = {
			isSibling: false,
			isInboundEdge: true,
			edge: edge,
		};
		if (included) {
			// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ isSibling: boolean; isInboundE... Remove this comment to see the full error message
			filteredPubEdges.push(edgeInContext);
		}
		if (pubIsParent) {
			// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ isSibling: boolean; isInboundE... Remove this comment to see the full error message
			parentEdgesInContext.push(edgeInContext);
		} else {
			// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ isSibling: boolean; isInboundE... Remove this comment to see the full error message
			childEdgesInContext.push(edgeInContext);
		}
	});

	siblingEdges.forEach((edge) => {
		const { pubIsParent, pub, targetPub } = edge;
		const edgeInContext = {
			isSibling: true,
			isInboundEdge: false,
			edge: edge,
			parentPub: pubIsParent ? pub : targetPub,
		};
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ isSibling: boolean; isInboundE... Remove this comment to see the full error message
		siblingEdgesInContext.push(edgeInContext);
		if (includeSiblings) {
			// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ isSibling: boolean; isInboundE... Remove this comment to see the full error message
			filteredPubEdges.push(edgeInContext);
		}
	});

	return {
		filteredPubEdgesInContext: filteredPubEdges,
		collatedPubEdgesInContext: [
			...parentEdgesInContext,
			...childEdgesInContext,
			...siblingEdgesInContext,
		],
	};
};

type Props = OwnProps & typeof defaultProps;

const PubEdgeListing = (props: Props) => {
	const {
		accentColor,
		className,
		hideIfNoInitialMatches,
		initialMode,
		initialFilters,
		isolated,
		pubData,
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
		// @ts-expect-error ts-migrate(2345) FIXME: Type 'void' is not assignable to type 'string[]'.
		setFilters((currentFilters) => {
			const filterIndex = currentFilters.indexOf(filter);

			if (filterIndex > -1) {
				setFilters([
					...currentFilters.slice(0, filterIndex),
					...currentFilters.slice(filterIndex + 1),
				]);
			} else {
				setFilters([...currentFilters, filter]);
			}
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
							pubData={pubData}
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
							pubEdge={activeEdgeInContext.edge}
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
							parentPub={activeEdgeInContext.parentPub}
							accentColor={accentColor}
							showIcon={isolated}
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
							viewingFromSibling={activeEdgeInContext.isSibling}
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
							isInboundEdge={activeEdgeInContext.isInboundEdge}
							inPubBody
						>
							{isolated && controls}
						</PubEdgeListingCard>
				  )
				: filteredPubEdgesInContext.map(({ isInboundEdge, edge, isSibling }) => (
						<PubEdgeListingCard
							pubData={pubData}
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
							key={edge.url}
							pubEdge={edge}
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
							parentPub={activeEdgeInContext.parentPub}
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
PubEdgeListing.defaultProps = defaultProps;
export default PubEdgeListing;
