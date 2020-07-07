import { NonIdealState } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';

import { Filter, Mode, allFilters } from './constants';
import { pubEdgeType } from '../PubEdge/constants';
import PubEdgeListingCard from './PubEdgeListingCard';
import PubEdgeListingCounter from './PubEdgeListingCounter';
import PubEdgeListingControls from './PubEdgeListingControls';

require('./pubEdgeListing.scss');

const propTypes = {
	accentColor: PropTypes.string.isRequired,
	isolated: PropTypes.bool,
	pubTitle: PropTypes.string,
	pubEdges: PropTypes.arrayOf(pubEdgeType).isRequired,
	initialMode: PropTypes.string,
	initialFilters: PropTypes.arrayOf(PropTypes.string),
};

const defaultProps = {
	isolated: false,
	pubTitle: '',
	initialMode: Mode.Carousel,
	initialFilters: [Filter.Child],
};

const filterPubEdges = (filters, pubEdges) =>
	pubEdges.filter((pubEdge) => {
		let result = false;

		if (filters.indexOf(Filter.Parent) > -1) {
			result = result || pubEdge.pubIsParent;
		}

		if (filters.indexOf(Filter.Child) > -1) {
			result = result || !pubEdge.pubIsParent;
		}

		return result;
	});

const PubEdgeListing = (props) => {
	const { accentColor, initialMode, initialFilters, isolated, pubEdges, pubTitle } = props;
	const [index, setIndex] = useState(0);
	const [mode, setMode] = useState(initialMode);
	const [filters, setFilters] = useState(initialFilters);
	const filteredPubEdges = filterPubEdges(filters, pubEdges);
	const { [index]: active, length } = filteredPubEdges;
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

	const showControls = pubEdges.length > 1 && (!isolated || filteredPubEdges.length > 1);
	const controls = showControls && (
		<>
			<PubEdgeListingCounter index={index} count={length} />
			<PubEdgeListingControls
				accentColor={accentColor}
				filters={filters}
				mode={mode}
				showFilterMenu={!isolated}
				onBackClick={back}
				onNextClick={next}
				onFilterToggle={onFilterToggle}
				onAllFilterToggle={onAllFilterToggle}
				onModeChange={setMode}
			/>
		</>
	);

	const renderContent = () => {
		return (
			!isolated && (
				<div className="top">
					<h5 style={{ color: accentColor }}>Related Pubs</h5>
					{controls}
				</div>
			)
		);
	};
	const renderCards = () => {
		const cards =
			mode === Mode.Carousel ? (
				<PubEdgeListingCard
					pubTitle={pubTitle}
					pubEdge={active}
					accentColor={accentColor}
					showIcon={isolated}
				>
					{isolated && <div className="isolated-controls">{controls}</div>}
				</PubEdgeListingCard>
			) : (
				pubEdges.map((pubEdge) => (
					<PubEdgeListingCard
						key={pubEdge.url}
						pubTitle={pubTitle}
						pubEdge={pubEdge}
						accentColor={accentColor}
					/>
				))
			);

		return !isolated && (!active || filteredPubEdges.length === 0) ? (
			<NonIdealState title="No Results" icon="search" />
		) : (
			cards
		);
	};

	return (
		<div className="pub-edge-listing-component">
			{renderContent()}
			{renderCards()}
		</div>
	);
};

PubEdgeListing.propTypes = propTypes;
PubEdgeListing.defaultProps = defaultProps;
export default PubEdgeListing;
