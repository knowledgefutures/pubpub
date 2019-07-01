import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PubPreview from 'components/PubPreview/PubPreview';
import CollectionMultiSelect from 'components/CollectionMultiSelect/CollectionMultiSelect';
import InputField from 'components/InputField/InputField';
import DropdownButton from 'components/DropdownButton/DropdownButton';
import OrderPicker from 'components/OrderPicker/OrderPicker';
import { Button, Checkbox, Popover, PopoverInteractionKind, Position } from '@blueprintjs/core';

const propTypes = {
	onChange: PropTypes.func.isRequired,
	layoutIndex: PropTypes.number.isRequired,
	content: PropTypes.object.isRequired,
	pubs: PropTypes.array.isRequired,
	pubRenderList: PropTypes.array.isRequired,
	communityData: PropTypes.object.isRequired,
	/* Expected content */
	/* title, pubPreviewType, limit, pubIds, collectionIds, hideByline, hideDescription, hideDates, hideContributors */
};

class LayoutEditorPubs extends Component {
	constructor(props) {
		super(props);
		this.setMinimal = this.setMinimal.bind(this);
		this.setSmall = this.setSmall.bind(this);
		this.setMedium = this.setMedium.bind(this);
		this.setLarge = this.setLarge.bind(this);
		this.setLimit = this.setLimit.bind(this);
		this.setCollectionIds = this.setCollectionIds.bind(this);
		this.changeTitle = this.changeTitle.bind(this);
		this.changePubId = this.changePubId.bind(this);
		this.setHideByline = this.setHideByline.bind(this);
		this.setHideDescription = this.setHideDescription.bind(this);
		this.setHideDates = this.setHideDates.bind(this);
		this.setHideContributors = this.setHideContributors.bind(this);
		this.setPubIds = this.setPubIds.bind(this);
		this.orderPopoverRef = React.createRef();
	}

	setMinimal() {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			pubPreviewType: 'minimal',
		});
	}

	setSmall() {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			pubPreviewType: 'small',
		});
	}

	setMedium() {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			pubPreviewType: 'medium',
		});
	}

	setLarge() {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			pubPreviewType: 'large',
		});
	}

	setLimit(evt) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			limit: Number(evt.target.value),
		});
	}

	setHideByline(evt) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			hideByline: !evt.target.checked,
		});
	}

	setHideDescription(evt) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			hideDescription: !evt.target.checked,
		});
	}

	setHideDates(evt) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			hideDates: !evt.target.checked,
		});
	}

	setHideContributors(evt) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			hideContributors: !evt.target.checked,
		});
	}

	setCollectionIds(newCollectionIds) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			collectionIds: newCollectionIds,
			pubIds: this.props.content.pubIds
				.filter((item) => {
					return item;
				})
				.filter((pubId) => {
					if (!newCollectionIds.length) {
						return true;
					}
					const specifiedPub = this.props.pubs.reduce((prev, curr) => {
						if (curr.id === pubId) {
							return curr;
						}
						return prev;
					}, undefined);
					return specifiedPub.collectionPubs.reduce((prev, curr) => {
						if (newCollectionIds.indexOf(curr.collectionId) > -1) {
							return true;
						}
						return prev;
					}, false);
				}),
		});
	}

	setPubIds(newPubObjects) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			pubIds: newPubObjects.map((pub) => {
				return pub.id;
			}),
		});
	}

	changeTitle(evt) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			title: evt.target.value,
		});
	}

	changePubId(index, string) {
		const newPubIds = this.props.content.pubIds;
		newPubIds[index] = string;
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			pubIds: newPubIds
				.filter((item) => {
					return item;
				})
				.filter((pubId) => {
					if (!this.props.content.collectionId) {
						return true;
					}
					const specifiedPub = this.props.pubs.reduce((prev, curr) => {
						if (curr.id === pubId) {
							return curr;
						}
						return prev;
					}, undefined);
					return specifiedPub.collectionPubs.reduce((prev, curr) => {
						if (curr.collectionId === this.props.content.collectionId) {
							return true;
						}
						return prev;
					}, false);
				}),
		});
	}

	render() {
		const pubPreviewType = this.props.content.pubPreviewType;
		const displayLimit = this.props.content.limit || this.props.pubRenderList.length;
		const emptyPreviews = [];
		for (let index = 0; index < displayLimit; index += 1) {
			emptyPreviews.push(null);
		}
		const previews = [...this.props.content.pubIds, ...emptyPreviews].slice(0, displayLimit);
		const selectOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
		const collectionsById = {};
		this.props.communityData.collections.forEach((collection) => {
			collectionsById[collection.id] = collection;
		});
		const availablePubs = this.props.pubs.filter((pub) => {
			const collectionIds = this.props.content.collectionIds || [];
			if (!collectionIds.length) {
				return true;
			}
			return pub.collectionPubs.reduce((prev, curr) => {
				if (collectionIds.indexOf(curr.collectionId) > -1) {
					return true;
				}
				return prev;
			}, false);
		});

		return (
			<div className="layout-editor-pubs-component">
				<div className="block-header">
					<InputField
						label="Title"
						value={this.props.content.title}
						onChange={this.changeTitle}
					/>
					<InputField label="Filter by Collection">
						<CollectionMultiSelect
							allCollections={this.props.communityData.collections}
							selectedCollectionIds={this.props.content.collectionIds || []}
							onItemSelect={(newCollectionId) => {
								const existingCollectionIds =
									this.props.content.collectionIds || [];
								const newCollectionIds = [
									...existingCollectionIds,
									newCollectionId,
								];
								this.setCollectionIds(newCollectionIds);
							}}
							onRemove={(evt, collectionIndex) => {
								const existingCollectionIds =
									this.props.content.collectionIds || [];
								const newCollectionIds = existingCollectionIds.filter(
									(item, filterIndex) => {
										return filterIndex !== collectionIndex;
									},
								);
								this.setCollectionIds(newCollectionIds);
							}}
							placeholder="Add collections..."
						/>
					</InputField>
					<InputField label="Limit">
						<div className="bp3-button-group bp3-select">
							<select value={this.props.content.limit} onChange={this.setLimit}>
								<option value={0}>Show All pubs</option>
								{selectOptions.map((item) => {
									return (
										<option value={item} key={`option-${item}`}>
											Show {item} pub{item === 1 ? '' : 's'}
										</option>
									);
								})}
							</select>
						</div>
					</InputField>

					<InputField label="Order">
						<Popover
							content={
								<div>
									<OrderPicker
										selectedItems={this.props.content.pubIds
											.map((pubId) => {
												return availablePubs.reduce((prev, curr) => {
													if (curr.id === pubId) {
														return curr;
													}
													return prev;
												}, undefined);
											})
											.filter((pub) => {
												return !!pub;
											})}
										allItems={availablePubs}
										onChange={this.setPubIds}
										uniqueId={this.props.layoutIndex}
										selectedTitle="Pinned Pubs"
										availableTitle="Available Pubs"
										selectedTitleTooltip="Pinned pubs will be displayed first, followed by newest pubs."
									/>
								</div>
							}
							interactionKind={PopoverInteractionKind.CLICK}
							position={Position.BOTTOM_RIGHT}
							usePortal={false}
							minimal={true}
							popoverClassName="order-picker-popover"
							popoverDidOpen={() => {
								setTimeout(() => {
									/* This is a hacky way to solve this bug: */
									/* https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/patterns/using-a-portal.md */
									const overlayNode = this.orderPopoverRef.current.popoverElement
										.parentNode;
									const positions = overlayNode.style.transform
										.replace('translate3d(', '')
										.split(', ');
									overlayNode.style.left = positions[0];
									overlayNode.style.top = positions[1];
									overlayNode.style.transform = '';
									overlayNode.style.willChange = '';
								}, 0);
							}}
							ref={this.orderPopoverRef}
						>
							<DropdownButton label="Set custom order" />
						</Popover>
					</InputField>

					<div className="line-break" />

					<InputField label="Preview Type">
						<div className="bp3-button-group">
							<Button
								active={pubPreviewType === 'large'}
								onClick={this.setLarge}
								text="Large"
							/>
							<Button
								active={pubPreviewType === 'medium'}
								onClick={this.setMedium}
								text="Medium"
							/>
							<Button
								active={pubPreviewType === 'small'}
								onClick={this.setSmall}
								text="Small"
							/>
							<Button
								active={pubPreviewType === 'minimal'}
								onClick={this.setMinimal}
								text="Minimal"
							/>
						</div>
					</InputField>

					<InputField label="Preview Elements">
						<Checkbox
							checked={!this.props.content.hideByline}
							onChange={this.setHideByline}
							label="Byline"
						/>
						<Checkbox
							checked={
								pubPreviewType === 'minimal'
									? false
									: !this.props.content.hideDescription
							}
							onChange={this.setHideDescription}
							disabled={pubPreviewType === 'minimal'}
							label="Description"
						/>
						<Checkbox
							checked={
								pubPreviewType === 'minimal' ? false : !this.props.content.hideDates
							}
							onChange={this.setHideDates}
							disabled={pubPreviewType === 'minimal'}
							label="Dates"
						/>
						<Checkbox
							checked={
								pubPreviewType === 'minimal'
									? false
									: !this.props.content.hideContributors
							}
							onChange={this.setHideContributors}
							disabled={pubPreviewType === 'minimal'}
							label="Contributors"
						/>
					</InputField>
				</div>

				<div className="block-content">
					<div className="container">
						{this.props.content.title && (
							<div className="row">
								<div className="col-12">
									<h1>{this.props.content.title}</h1>
								</div>
							</div>
						)}

						{previews.map((item, index, array) => {
							const isTwoColumn = ['medium', 'minimal'].includes(pubPreviewType);
							if (isTwoColumn && index % 2 === 1) {
								return null;
							}
							const selectedPub = this.props.pubRenderList[index] || {
								collaborators: [],
							};
							if (!selectedPub.id) {
								return null;
							}
							const nextPub =
								isTwoColumn && index < array.length - 1
									? this.props.pubRenderList[index + 1]
									: null;

							return (
								<div key={selectedPub.id} className="row">
									<div className={isTwoColumn ? 'col-6' : 'col-12'}>
										<PubPreview
											pubData={selectedPub}
											size={pubPreviewType}
											hideByline={this.props.content.hideByline}
											hideDescription={this.props.content.hideDescription}
											hideDates={this.props.content.hideDates}
											hideContributors={this.props.content.hideContributors}
										/>
									</div>

									{nextPub && (
										<div className={isTwoColumn ? 'col-6' : 'col-12'}>
											<PubPreview
												pubData={nextPub}
												size={pubPreviewType}
												hideByline={this.props.content.hideByline}
												hideDescription={this.props.content.hideDescription}
												hideDates={this.props.content.hideDates}
												hideContributors={
													this.props.content.hideContributors
												}
											/>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			</div>
		);
	}
}

LayoutEditorPubs.propTypes = propTypes;
export default LayoutEditorPubs;
