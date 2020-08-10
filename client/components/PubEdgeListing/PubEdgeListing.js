import { NonIdealState } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';

import { Filter, Mode, allFilters } from './constants';
import { pubEdgeType } from '../PubEdge/constants';
import PubEdgeListingCard from './PubEdgeListingCard';
import PubEdgeListingCounter from './PubEdgeListingCounter';
import PubEdgeListingControls from './PubEdgeListingControls';

require('./pubEdgeListing.scss');

const propTypes = {
	accentColor: PropTypes.string.isRequired,
	className: PropTypes.string,
	hideIfNoInitialMatches: PropTypes.bool,
	isolated: PropTypes.bool,
	pubData: PropTypes.shape({
		inboundEdges: PropTypes.arrayOf(pubEdgeType).isRequired,
		outboundEdges: PropTypes.arrayOf(pubEdgeType).isRequired,
		siblingEdges: PropTypes.arrayOf(pubEdgeType).isRequired,
	}).isRequired,
	initialMode: PropTypes.string,
	initialFilters: PropTypes.arrayOf(PropTypes.string),
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
			edge: edge,
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
			edge: edge,
			parentPub: pubIsParent ? pub : targetPub,
		};
		siblingEdgesInContext.push(edgeInContext);
		if (includeSiblings) {
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

const PubEdgeListing = (props) => {
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
				: filteredPubEdgesInContext.map(({ isInboundEdge, edge, isSibling }) => (
						<PubEdgeListingCard
							key={edge.url}
							pubEdge={edge}
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

PubEdgeListing.propTypes = propTypes;
PubEdgeListing.defaultProps = defaultProps;
export default PubEdgeListing;
