import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PubPreview from 'components/PubPreview/PubPreview';
import TagMultiSelect from 'components/TagMultiSelect/TagMultiSelect';
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
	/* title, pubPreviewType, limit, pubIds, tagIds, hideByline, hideDescription, hideDates, hideContributors */
};

class LayoutEditorPubs extends Component {
	constructor(props) {
		super(props);
		this.setSmall = this.setSmall.bind(this);
		this.setMedium = this.setMedium.bind(this);
		this.setLarge = this.setLarge.bind(this);
		this.setLimit = this.setLimit.bind(this);
		this.setTagIds = this.setTagIds.bind(this);
		this.changeTitle = this.changeTitle.bind(this);
		this.changePubId = this.changePubId.bind(this);
		this.setHideByline = this.setHideByline.bind(this);
		this.setHideDescription = this.setHideDescription.bind(this);
		this.setHideDates = this.setHideDates.bind(this);
		this.setHideContributors = this.setHideContributors.bind(this);
		this.setPubIds = this.setPubIds.bind(this);
		this.orderPopoverRef = React.createRef();
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

	setTagIds(newTagIds) {
		// console.log('evt', evt);
		// const newTagId = evt.target.value;
		// const existingTagIds = this.props.content.tagIds || [];
		// const newTagIds = [...existingTagIds, newTagId];
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			tagIds: newTagIds,
			pubIds: this.props.content.pubIds
				.filter((item) => {
					return item;
				})
				.filter((pubId) => {
					if (!newTagIds.length) {
						return true;
					}
					const specifiedPub = this.props.pubs.reduce((prev, curr) => {
						if (curr.id === pubId) {
							return curr;
						}
						return prev;
					}, undefined);
					return specifiedPub.collectionPubs.reduce((prev, curr) => {
						if (newTagIds.indexOf(curr.tagId) > -1) {
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
					if (!this.props.content.tagId) {
						return true;
					}
					const specifiedPub = this.props.pubs.reduce((prev, curr) => {
						if (curr.id === pubId) {
							return curr;
						}
						return prev;
					}, undefined);
					return specifiedPub.collectionPubs.reduce((prev, curr) => {
						if (curr.tagId === this.props.content.tagId) {
							return true;
						}
						return prev;
					}, false);
				}),
		});
	}

	render() {
		const pubPreviewType = this.props.content.pubPreviewType;
		// const displayLimit = this.props.content.limit || Math.max(4, this.props.pubRenderList.length);
		const displayLimit = this.props.content.limit || this.props.pubRenderList.length;
		const emptyPreviews = [];
		for (let index = 0; index < displayLimit; index += 1) {
			emptyPreviews.push(null);
		}
		const previews = [...this.props.content.pubIds, ...emptyPreviews].slice(0, displayLimit);
		const selectOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
		// const activeTag = this.props.communityData.tags.reduce((prev, curr)=> {
		// 	if (curr.id === this.props.content.tagId) { return curr; }
		// 	return prev;
		// }, {});
		const tagsById = {};
		this.props.communityData.tags.forEach((tag) => {
			tagsById[tag.id] = tag;
		});
		const availablePubs = this.props.pubs.filter((pub) => {
			const tagIds = this.props.content.tagIds || [];
			if (!tagIds.length) {
				return true;
			}
			return pub.collectionPubs.reduce((prev, curr) => {
				if (tagIds.indexOf(curr.tagId) > -1) {
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
					<InputField label="Filter by Tag">
						<TagMultiSelect
							allTags={this.props.communityData.tags}
							selectedTagIds={this.props.content.tagIds || []}
							onItemSelect={(newTagId) => {
								const existingTagIds = this.props.content.tagIds || [];
								const newTagIds = [...existingTagIds, newTagId];
								this.setTagIds(newTagIds);
							}}
							onRemove={(evt, tagIndex) => {
								const existingTagIds = this.props.content.tagIds || [];
								const newTagIds = existingTagIds.filter((item, filterIndex) => {
									return filterIndex !== tagIndex;
								});
								this.setTagIds(newTagIds);
							}}
							placeholder="Add tags..."
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
								className={`${pubPreviewType === 'large' ? 'bp3-active' : ''}`}
								onClick={this.setLarge}
								text="Large"
							/>
							<Button
								className={`${pubPreviewType === 'medium' ? 'bp3-active' : ''}`}
								onClick={this.setMedium}
								text="Medium"
							/>
							<Button
								className={`${pubPreviewType === 'small' ? 'bp3-active' : ''}`}
								onClick={this.setSmall}
								text="Small"
							/>
						</div>
					</InputField>

					<InputField label="Preview Elements">
						<Checkbox
							checked={!this.props.content.hideByline}
							onChange={this.setHideByline}
						>
							Byline
						</Checkbox>
						<Checkbox
							checked={!this.props.content.hideDescription}
							onChange={this.setHideDescription}
						>
							Description
						</Checkbox>
						<Checkbox
							checked={!this.props.content.hideDates}
							onChange={this.setHideDates}
						>
							Dates
						</Checkbox>
						<Checkbox
							checked={!this.props.content.hideContributors}
							onChange={this.setHideContributors}
						>
							Contributors
						</Checkbox>
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

						<div className="row">
							{previews.map((item, index) => {
								const selectPub =
									(this.props.pubRenderList && this.props.pubRenderList[index]) ||
									{};
								if (!selectPub.id) {
									return null;
								}
								return (
									<div
										key={selectPub.id}
										className={pubPreviewType === 'medium' ? 'col-6' : 'col-12'}
									>
										<PubPreview
											size={pubPreviewType}
											pubData={selectPub}
											hideByline={this.props.content.hideByline}
											hideDescription={this.props.content.hideDescription}
											hideDates={this.props.content.hideDates}
											hideContributors={this.props.content.hideContributors}
										/>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		);
	}
}

LayoutEditorPubs.propTypes = propTypes;
export default LayoutEditorPubs;
