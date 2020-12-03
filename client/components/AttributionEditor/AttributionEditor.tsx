import React, { Component } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { apiFetch } from 'client/utils/apiFetch';

import attributionType from 'types/attribution';
import UserAutocomplete from 'components/UserAutocomplete/UserAutocomplete';

import { NonIdealState } from '@blueprintjs/core';
import AttributionRow from './AttributionRow';
import DragDropListing from '../DragDropListing/DragDropListing';

require('./attributionEditor.scss');

type OwnProps = {
	apiRoute: string;
	canEdit: boolean;
	attributions: attributionType[];
	identifyingProps: {};
	onUpdateAttributions: (...args: any[]) => any;
	onPersistStateChange?: (...args: any[]) => any;
	listOnBylineText?: string;
	hasEmptyState?: boolean;
	promiseWrapper?: (...args: any[]) => any;
};

const defaultProps = {
	listOnBylineText: 'List on byline',
	onPersistStateChange: () => {},
	promiseWrapper: (x) => x,
	hasEmptyState: true,
};

type Props = OwnProps & typeof defaultProps;

class AttributionEditor extends Component<Props> {
	static defaultProps = defaultProps;

	constructor(props: Props) {
		super(props);
		this.handleDragEnd = this.handleDragEnd.bind(this);
		this.handleAttributionAdd = this.handleAttributionAdd.bind(this);
		this.handleAttributionUpdate = this.handleAttributionUpdate.bind(this);
		this.handleAttributionDelete = this.handleAttributionDelete.bind(this);
	}

	persistAttribution(data, method) {
		const { apiRoute, identifyingProps, promiseWrapper } = this.props;
		return promiseWrapper(
			apiFetch(apiRoute, {
				method: method,
				body: JSON.stringify({
					...data,
					...identifyingProps,
				}),
			}),
		);
	}

	handleAttributionAdd(user) {
		const { attributions, onUpdateAttributions, onPersistStateChange } = this.props;
		const calculatedOrder =
			attributions.length === 0
				? 0.5
				: attributions.sort((a, b) => {
						const sortOnOrder = a.order - b.order;
						if (sortOnOrder !== 0) {
							return sortOnOrder;
						}
						return b.createdAt - a.createdAt;
				  })[0].order / 2;
		onPersistStateChange(1);
		this.persistAttribution(
			{
				userId: user.id,
				name: user.name,
				order: calculatedOrder,
				isAuthor: true,
			},
			'POST',
		).then((result) => {
			const { attributions: attributionsNow } = this.props;
			onUpdateAttributions([...attributionsNow, result]);
			onPersistStateChange(-1);
		});
	}

	handleAttributionUpdate(updatedAttribution) {
		const { attributions, onUpdateAttributions, onPersistStateChange } = this.props;
		const newAttributions = attributions.map((attribution) => {
			if (attribution.id !== updatedAttribution.id) {
				return attribution;
			}
			return {
				...attribution,
				...updatedAttribution,
			};
		});
		onUpdateAttributions(newAttributions);
		onPersistStateChange(1);
		this.persistAttribution(updatedAttribution, 'PUT').then(() => onPersistStateChange(-1));
	}

	handleAttributionDelete(attributionId) {
		const { attributions, onUpdateAttributions, onPersistStateChange } = this.props;
		onUpdateAttributions(
			attributions.filter((attribution) => attribution.id !== attributionId),
		);
		onPersistStateChange(1);
		this.persistAttribution({ id: attributionId }, 'DELETE').then(() =>
			onPersistStateChange(-1),
		);
	}

	handleDragEnd(result) {
		const { attributions, identifyingProps, onUpdateAttributions } = this.props;

		if (!result.destination) {
			return;
		}

		const sourceIndex = result.source.index;
		const sourceId = attributions[sourceIndex].id;
		const destIndex = result.destination.index;
		const destinationOrder = attributions[destIndex].order;
		const direction = sourceIndex > destIndex ? -1 : 1;
		let newOrder = 0.5;

		if (sourceIndex === destIndex) {
			newOrder = attributions[sourceIndex].order;
		} else if (result.destination.index === 0) {
			newOrder = destinationOrder / 2;
		} else if (result.destination.index === attributions.length - 1) {
			newOrder = (1 + destinationOrder) / 2;
		} else {
			const destinationNeighborOrder = attributions[destIndex + direction].order;
			newOrder = (destinationOrder + destinationNeighborOrder) / 2;
		}

		this.handleAttributionUpdate({
			...identifyingProps,
			id: sourceId,
			order: newOrder,
		});

		const newAttributions = attributions.map((attribution) => {
			if (attribution.id !== sourceId) {
				return attribution;
			}
			return {
				...attribution,
				order: newOrder,
			};
		});

		onUpdateAttributions(newAttributions);
	}

	render() {
		const { attributions, canEdit, listOnBylineText, hasEmptyState } = this.props;
		const sortedAttributions = attributions.sort((a, b) => a.order - b.order);
		return (
			<div className="attribution-editor-component">
				{canEdit && (
					<React.Fragment>
						<UserAutocomplete
							// @ts-expect-error ts-migrate(2322) FIXME: Type '(user: any) => void' is not assignable to ty... Remove this comment to see the full error message
							onSelect={this.handleAttributionAdd}
							allowCustomUser={true}
							placeholder="Add new person..."
							// @ts-expect-error ts-migrate(2322) FIXME: Type '(string | undefined)[]' is not assignable to... Remove this comment to see the full error message
							usedUserIds={attributions
								.map((item) => {
									return item.user && item.user.id;
								})
								.filter((x) => x)}
						/>
						<DragDropContext onDragEnd={this.handleDragEnd}>
							<DragDropListing
								droppableType="ATTRIBUTION"
								droppableId="attributionEditor"
								items={sortedAttributions}
								itemId={(attribution) => attribution.id}
								withDragHandles={true}
								renderItem={(attribution, dragHandleProps, isDragging) => (
									<AttributionRow
										// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
										attribution={attribution}
										// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
										canEdit={true}
										// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
										isDragging={isDragging}
										// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
										dragHandleProps={dragHandleProps}
										// @ts-expect-error ts-migrate(2322) FIXME: Type '(attributionId: any) => void' is not assigna... Remove this comment to see the full error message
										onAttributionDelete={this.handleAttributionDelete}
										// @ts-expect-error ts-migrate(2322) FIXME: Type '(updatedAttribution: any) => void' is not as... Remove this comment to see the full error message
										onAttributionUpdate={this.handleAttributionUpdate}
										// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
										listOnBylineText={listOnBylineText}
									/>
								)}
								renderEmptyState={() =>
									hasEmptyState && (
										<NonIdealState
											icon="person"
											title="No contributors yet!"
											description="Start typing a person's name above to add a contributor."
										/>
									)
								}
							/>
						</DragDropContext>
					</React.Fragment>
				)}
				{!canEdit &&
					sortedAttributions.map((attribution) => {
						return (
							<AttributionRow
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
								key={attribution.id}
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'attribution' is not assignable to type 'neve... Remove this comment to see the full error message
								attribution={attribution}
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
								canEdit={false}
								// isDragging={isDragging}
								// dragHandleProps={dragHandleProps}
								// @ts-expect-error ts-migrate(2322) FIXME: Type '() => void' is not assignable to type 'never... Remove this comment to see the full error message
								onAttributionDelete={() => {}}
								// @ts-expect-error ts-migrate(2322) FIXME: Type '() => void' is not assignable to type 'never... Remove this comment to see the full error message
								onAttributionUpdate={() => {}}
							/>
						);
					})}
			</div>
		);
	}
}
export default AttributionEditor;
