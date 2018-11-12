import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PubPreview from 'components/PubPreview/PubPreview';
import TagMultiSelect from 'components/TagMultiSelect/TagMultiSelect';
// import { Position } from '@blueprintjs/core';
// import { MultiSelect } from '@blueprintjs/select';
// import fuzzysearch from 'fuzzysearch';

const propTypes = {
	onChange: PropTypes.func.isRequired,
	onRemove: PropTypes.func.isRequired,
	layoutIndex: PropTypes.number.isRequired,
	content: PropTypes.object.isRequired,
	pubs: PropTypes.array.isRequired,
	pubRenderList: PropTypes.array.isRequired,
	communityData: PropTypes.object.isRequired,
	/* Expected content */
	/* title, pubPreviewType, limit, pubIds, tagIds */
};

class LayoutEditorPubs extends Component {
	constructor(props) {
		super(props);
		this.handleRemove = this.handleRemove.bind(this);
		this.setSmall = this.setSmall.bind(this);
		this.setMedium = this.setMedium.bind(this);
		this.setLarge = this.setLarge.bind(this);
		this.setLimit = this.setLimit.bind(this);
		this.setTagIds = this.setTagIds.bind(this);
		this.changeTitle = this.changeTitle.bind(this);
		this.changePubId = this.changePubId.bind(this);
	}

	handleRemove() {
		this.props.onRemove(this.props.layoutIndex);
	}

	setSmall() {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			pubPreviewType: 'small'
		});
	}

	setMedium() {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			pubPreviewType: 'medium'
		});
	}

	setLarge() {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			pubPreviewType: 'large'
		});
	}

	setLimit(evt) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			limit: Number(evt.target.value)
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
			pubIds: this.props.content.pubIds.filter((item)=> {
				return item;
			}).filter((pubId)=> {
				if (!newTagsIds.length) { return true; }
				const specifiedPub = this.props.pubs.reduce((prev, curr)=> {
					if (curr.id === pubId) { return curr; }
					return prev;
				}, undefined);
				return specifiedPub.pubTags.reduce((prev, curr)=> {
					if (newTagIds.indexOf(curr.tagId) > -1) { return true; }
					return prev;
				}, false);
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
			pubIds: newPubIds.filter((item)=> {
				return item;
			}).filter((pubId)=> {
				if (!this.props.content.tagId) { return true; }
				const specifiedPub = this.props.pubs.reduce((prev, curr)=> {
					if (curr.id === pubId) { return curr; }
					return prev;
				}, undefined);
				return specifiedPub.pubTags.reduce((prev, curr)=> {
					if (curr.tagId === this.props.content.tagId) { return true; }
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
		this.props.communityData.tags.forEach((tag)=> {
			tagsById[tag.id] = tag;
		});
		return (
			<div className="layout-editor-pubs-component">
				<div className="block-header">
					<div className="pt-form-group">
						<label htmlFor={`section-title-${this.props.layoutIndex}`}>Pubs Section Title</label>
						<input id={`section-title-${this.props.layoutIndex}`} type="text" className="pt-input" value={this.props.content.title} onChange={this.changeTitle} />
					</div>
					<div className="spacer" />
					<div className="pt-form-group">
						<label htmlFor={`section-tag-${this.props.layoutIndex}`}>Use Tag</label>
						<div className="pt-button-group pt-select">
							<TagMultiSelect
								allTags={this.props.communityData.tags}
								selectedTagIds={this.props.content.tagIds || []}
								onItemSelect={(newTagId)=> {
									const existingTagIds = this.props.content.tagIds || [];
									const newTagIds = [...existingTagIds, newTagId];
									this.setTagIds(newTagIds);
								}}
								onRemove={(evt, tagIndex)=> {
									const existingTagIds = this.props.content.tagIds || [];
									const newTagIds = existingTagIds.filter((item, filterIndex)=> {
										return filterIndex !== tagIndex;
									});
									this.setTagIds(newTagIds);
								}}
								placeholder="Add tags..."
							/>
						</div>
					</div>
					<div className="pt-form-group">
						<label htmlFor={`section-size-${this.props.layoutIndex}`}>Preview Type</label>
						<div className="pt-button-group">
							<button className={`pt-button ${pubPreviewType === 'large' ? 'pt-active' : ''}`} onClick={this.setLarge}>Large</button>
							<button className={`pt-button ${pubPreviewType === 'medium' ? 'pt-active' : ''}`} onClick={this.setMedium}>Medium</button>
							<button className={`pt-button ${pubPreviewType === 'small' ? 'pt-active' : ''}`} onClick={this.setSmall}>Small</button>
						</div>
					</div>
					<div className="pt-form-group">
						<label htmlFor={`section-limit-${this.props.layoutIndex}`}>Limit</label>
						<div className="pt-button-group pt-select">
							<select value={this.props.content.limit} onChange={this.setLimit}>
								<option value={0}>Show All pubs</option>
								{selectOptions.map((item)=> {
									return <option value={item} key={`option-${item}`}>Show {item} pub{item === 1 ? '' : 's'}</option>
								})}
							</select>
						</div>
					</div>
					<div className="pt-form-group">
						<div className="pt-button-group">
							<button className="pt-button pt-icon-trash" onClick={this.handleRemove} />
						</div>
					</div>
				</div>

				<div className="block-content">
					<div className="container">
						{this.props.content.title &&
							<div className="row">
								<div className="col-12">
									<h1>{this.props.content.title}</h1>
								</div>
							</div>
						}

						<div className="row">
							{previews.map((item, index)=> {
								const selectPub = (this.props.pubRenderList && this.props.pubRenderList[index]) || {};
								return (
									<div key={`preview-${this.props.layoutIndex}-${index}`} className={pubPreviewType === 'medium' ? 'col-6' : 'col-12'}>
										<PubPreview
											size={pubPreviewType}
											isPlaceholder={true}
											title={this.props.content.pubIds[index] ? selectPub.title : undefined}
											inputContent={this.props.content.pubIds.length >= index
												? <div className="pt-select">
													<select value={this.props.content.pubIds[index] || ''} onChange={(evt)=> { this.changePubId(index, evt.target.value); }}>
														<option value="">Choose specific Pub</option>
														{this.props.pubs.filter((pub)=> {
															const tagIds = this.props.content.tagIds || [];
															if (!tagIds.length) { return true; }
															return pub.pubTags.reduce((prev, curr)=> {
																// if (curr.tagId === this.props.content.tagId) { return true; }
																if (tagIds.indexOf(curr.tagId) > -1) { return true; }
																return prev;
															}, false);
														// }).filter((pub)=> {
															// return pub.firstPublishedAt;
														}).sort((foo, bar)=> {
															if (foo.title < bar.title) { return -1; }
															if (foo.title > bar.title) { return 1; }
															return 0;
														}).map((pub)=> {
															return <option value={pub.id} key={`option-${pub.id}`}>{pub.title}</option>;
														})}
													</select>
												</div>
												: null
											}
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
