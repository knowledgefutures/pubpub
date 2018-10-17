import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { MenuItem } from '@blueprintjs/core';
// import { Suggest } from '@blueprintjs/labs';
import { Suggest } from '@blueprintjs/select';
import fuzzysearch from 'fuzzysearch';
import { generateHash } from 'utilities';

require('./collectionAutocomplete.scss');

const propTypes = {
	pages: PropTypes.array.isRequired,
	usedItems: PropTypes.array,
	onSelect: PropTypes.func,
	placeholder: PropTypes.string,
	allowCustom: PropTypes.bool,
};

const defaultProps = {
	usedItems: [],
	onSelect: ()=>{},
	placeholder: 'Create Dropdown or Add Page...',
	allowCustom: false,
};

class CollectionAutocomplete extends Component {
	constructor(props) {
		super(props);
		this.getFilteredItems = this.getFilteredItems.bind(this);
		this.state = {
			items: this.getFilteredItems(props, ''),
			value: '',
		};
		this.filterItems = this.filterItems.bind(this);
		this.handleSelect = this.handleSelect.bind(this);
	}

	componentWillReceiveProps(nextProps) {
		this.setState({
			items: this.getFilteredItems(nextProps, ''),
		});
	}

	getFilteredItems(props, query) {
		const usedIndexes = props.usedItems.map((item)=> {
			return item.id;
		});
		return props.pages.filter((item)=> {
			const fuzzyMatchName = fuzzysearch(query.toLowerCase(), item.title.toLowerCase());
			const fuzzyMatchSlug = fuzzysearch(query.toLowerCase(), item.slug.toLowerCase());
			const alreadyUsed = usedIndexes.indexOf(item.id) > -1;
			return item.slug && !alreadyUsed && (fuzzyMatchName || fuzzyMatchSlug);
		}).sort((foo, bar)=> {
			if (foo.title < bar.title) { return -1; }
			if (foo.title > bar.title) { return 1; }
			return 0;
		});
	}

	filterItems(evt) {
		const query = evt.target.value;
		const filteredItems = this.getFilteredItems(this.props, query);
		const createOption = {
			title: query,
			children: [],
			id: generateHash(8),
		};
		const outputItems = query && this.props.allowCustom
			? [createOption, ...filteredItems]
			: filteredItems;
		this.setState({
			value: query,
			items: outputItems,
		});
	}

	handleSelect(data) {
		this.props.onSelect(data);
		this.setState({ value: '' });
	}


	render() {
		return (
			<div className="collection-autocomplete-component">
				<Suggest
					className="input"
					items={this.state.items}
					inputProps={{
						value: this.state.value,
						onChange: this.filterItems,
						placeholder: this.props.placeholder,
					}}
					inputValueRenderer={(item) => { return item.title; }}
					itemRenderer={(item = {}, { handleClick, isActive })=> {
						return (
							<li key={item.id || 'empty-user-create'}>
								<a role="button" tabIndex={-1} onClick={handleClick} className={isActive ? 'pt-menu-item pt-active' : 'pt-menu-item'}>
									{item.children && <span className="new-title">Create dropdown group:</span>}
									<span className="title">{item.title}</span>
								</a>
							</li>
						);
					}}
					onItemSelect={this.handleSelect}
					noResults={<MenuItem disabled text="No results" />}
					popoverProps={{ popoverClassName: 'pt-minimal collection-autocomplete-popover' }}
				/>
			</div>
		);
	}
}

CollectionAutocomplete.propTypes = propTypes;
CollectionAutocomplete.defaultProps = defaultProps;
export default CollectionAutocomplete;
