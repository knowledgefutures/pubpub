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
		inboundEdges: PropTypes.shape(pubEdgeType).isRequired,
		outboundEdges: PropTypes.shape(pubEdgeType).isRequired,
		siblingEdges: PropTypes.shape(pubEdgeType).isRequired,
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
	const parentEdgeValues = [];
	const childEdgeValues = [];
	const siblingEdgeValues = [];

	outboundEdges.forEach((edge) => {
		const { pubIsParent } = edge;
		const included = pubIsParent ? includeChildren : includeParents;
		const edgeValue = {
			isSibling: false,
			isInboundEdge: false,
			edge: edge,
			pubTitle: null,
		};
		if (included) {
			filteredPubEdges.push(edgeValue);
		}
		if (pubIsParent) {
			childEdgeValues.push(edgeValue);
		} else {
			parentEdgeValues.push(edgeValue);
		}
	});

	inboundEdges.forEach((edge) => {
		const { pubIsParent } = edge;
		const included = pubIsParent ? includeParents : includeChildren;
		const edgeValue = {
			isSibling: false,
			isInboundEdge: true,
			edge: edge,
			pubTitle: null,
		};
		if (included) {
			filteredPubEdges.push(edgeValue);
		}
		if (pubIsParent) {
			parentEdgeValues.push(edgeValue);
		} else {
			childEdgeValues.push(edgeValue);
		}
	});

	siblingEdges.forEach((edge) => {
		const { pubIsParent, pub, targetPub } = edge;
		const edgeValue = {
			isSibling: true,
			isInboundEdge: false,
			edge: edge,
			pubTitle: pubIsParent ? pub.title : targetPub.title,
		};
		siblingEdgeValues.push(edgeValue);
		if (includeSiblings) {
			filteredPubEdges.push(edgeValue);
		}
	});

	return {
		filteredPubEdgeValues: filteredPubEdges,
		collatedPubEdgeValues: [...parentEdgeValues, ...childEdgeValues, ...siblingEdgeValues],
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

	const { filteredPubEdgeValues, collatedPubEdgeValues } = collateAndFilterPubEdges(
		filters,
		pubData,
	);

	const [initiallyRenderEmpty] = useState(
		hideIfNoInitialMatches && filteredPubEdgeValues.length === 0,
	);
	const { [index]: activeEdgeValue, length } = filteredPubEdgeValues;

	const next = useCallback(() => setIndex((i) => (i + 1) % length), [length]);
	const back = useCallback(() => setIndex((i) => (i - 1 + length) % length), [length]);

	const onFilterToggle = useCallback(
		(filter) =>
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
			}),
		[],
	);

	const onAllFilterToggle = useCallback(
		() =>
			setFilters((currentFilters) =>
				currentFilters.length === Object.keys(Filter).length ? [] : allFilters,
			),
		[],
	);

	const disableCarouselControls = filteredPubEdgeValues.length === 1;
	const showControls =
		collatedPubEdgeValues.length > 1 && (!isolated || filteredPubEdgeValues.length > 1);

	const controls = showControls && (
		<>
			<PubEdgeListingCounter index={index} count={length} />
			<PubEdgeListingControls
				accentColor={accentColor}
				carouselControlsDisabled={disableCarouselControls}
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
				? activeEdgeValue && (
						<PubEdgeListingCard
							pubEdge={activeEdgeValue.edge}
							accentColor={accentColor}
							showIcon={isolated}
							viewingFromSibling={activeEdgeValue.isSibling}
							isInboundEdge={activeEdgeValue.isInboundEdge}
							inPubBody
						>
							{isolated && controls}
						</PubEdgeListingCard>
				  )
				: filteredPubEdgeValues.map(({ isInboundEdge, edge, isSibling }) => (
						<PubEdgeListingCard
							key={edge.url}
							pubEdge={edge}
							accentColor={accentColor}
							viewingFromSibling={isSibling}
							isInboundEdge={isInboundEdge}
							inPubBody
						/>
				  ));

		return !isolated && (!activeEdgeValue || filteredPubEdgeValues.length === 0) ? (
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
