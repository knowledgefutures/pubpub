import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Position, Spinner, Tag, MenuItem } from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';
import fuzzysearch from 'fuzzysearch';
import Icon from 'components/Icon/Icon';
import { apiFetch } from 'utilities';

require('./pubOptionsTags.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	setPubData: PropTypes.func.isRequired,
};

class PubOptionsTags extends Component {
	constructor(props) {
		super(props);
		this.state = {
			/* We store pubTags in state of this component so we can do immediate */
			/* updates and save in the background without jumpy effects */
			pubTags: this.props.pubData.pubTags,
			isLoading: false,
		};
		this.inputRef = undefined;
		this.getFilteredTags = this.getFilteredTags.bind(this);
		this.handlePubTagAdd = this.handlePubTagAdd.bind(this);
		this.handlePubTagDelete = this.handlePubTagDelete.bind(this);
	}

	getFilteredTags(query, existingPubTags) {
		const existingTagIds = existingPubTags.map((pubTag) => {
			return pubTag.tag.id;
		});
		const defaultTags = this.props.communityData.tags;
		const filteredDefaultTags = defaultTags
			.filter((item) => {
				const fuzzyMatchTag = fuzzysearch(query.toLowerCase(), item.title.toLowerCase());
				const alreadyUsed = existingTagIds.indexOf(item.id) > -1;
				return !alreadyUsed && fuzzyMatchTag;
			})
			.sort((foo, bar) => {
				if (foo.title.toLowerCase() < bar.title.toLowerCase()) {
					return -1;
				}
				if (foo.title.toLowerCase() > bar.title.toLowerCase()) {
					return 1;
				}
				return 0;
			});

		const addNewTagOption = defaultTags.reduce((prev, curr) => {
			if (curr.title.toLowerCase() === query.toLowerCase()) {
				return false;
			}
			return prev;
		}, true);
		const newTagOption = query && addNewTagOption ? [{ title: query }] : [];

		const outputTags = [...newTagOption, ...filteredDefaultTags];
		return outputTags;
	}

	handlePubTagAdd(tag) {
		this.inputRef.focus();
		return apiFetch('/api/pubTags', {
			method: 'POST',
			body: JSON.stringify({
				title: tag.title,
				tagId: tag.id,
				pubId: this.props.pubData.id,
				communityId: this.props.communityData.id,
			}),
		}).then((result) => {
			this.setState((prevState) => {
				const newPubTags = [...prevState.pubTags, result];
				this.props.setPubData({
					...this.props.pubData,
					pubTags: newPubTags,
				});
				return { pubTags: newPubTags };
			});
		});
	}

	handlePubTagDelete(pubTagId) {
		this.setState(
			(prevState) => {
				const newPubTags = prevState.pubTags.filter((pubTag) => {
					return pubTag.id !== pubTagId;
				});
				return { pubTags: newPubTags, isLoading: true };
			},
			() => {
				apiFetch('/api/pubTags', {
					method: 'DELETE',
					body: JSON.stringify({
						pubTagId: pubTagId,
						pubId: this.props.pubData.id,
						communityId: this.props.communityData.id,
					}),
				}).then(() => {
					this.props.setPubData({
						...this.props.pubData,
						pubTags: this.state.pubTags,
					});
					this.setState({ isLoading: false });
				});
			},
		);
	}

	render() {
		const pubTags = this.state.pubTags;
		return (
			<div className="pub-options-tags-component">
				{this.state.isLoading && (
					<div className="save-wrapper">
						<Spinner small={true} /> Saving...
					</div>
				)}
				<h1>Tags</h1>
				<Suggest
					items={pubTags}
					inputProps={{
						placeholder: 'Add Tag...',
						className: 'bp3-large',
						inputRef: (ref) => {
							this.inputRef = ref;
						},
					}}
					itemListPredicate={this.getFilteredTags}
					inputValueRenderer={() => {
						return '';
					}}
					itemRenderer={(item, { handleClick, modifiers }) => {
						return (
							<li key={item.id || 'empty-user-create'}>
								<button
									type="button"
									tabIndex={-1}
									onClick={handleClick}
									className={
										modifiers.active
											? 'bp3-menu-item bp3-active'
											: 'bp3-menu-item'
									}
								>
									{!item.id && <span>Create new tag: </span>}
									<span className="autocomplete-name">
										{item.id && !item.isPublic && <Icon icon="lock2" />}
										{item.title}
									</span>
								</button>
							</li>
						);
					}}
					resetOnSelect={true}
					onItemSelect={this.handlePubTagAdd}
					noResults={<MenuItem disabled text="No results" />}
					popoverProps={{
						// isOpen: this.state.queryValue,
						popoverClassName: 'bp3-minimal tag-autocomplete-popover',
						position: Position.BOTTOM_LEFT,
						modifiers: {
							preventOverflow: { enabled: false },
							hide: { enabled: false },
						},
					}}
				/>

				<div className="tags-wrapper">
					{pubTags.map((pubTag) => {
						return (
							<Tag
								key={pubTag.id}
								className="bp3-minimal bp3-intent-primary"
								large={true}
								onRemove={() => {
									this.handlePubTagDelete(pubTag.id);
								}}
							>
								{!pubTag.tag.isPublic && <Icon icon="lock2" />}
								{pubTag.tag.title}
							</Tag>
						);
					})}
				</div>
			</div>
		);
	}
}

PubOptionsTags.propTypes = propTypes;
export default PubOptionsTags;
