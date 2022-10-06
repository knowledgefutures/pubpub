/* eslint-disable react/no-unused-prop-types */
import React, { Component } from 'react';
import { MenuItem, Position } from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';
import fuzzysearch from 'fuzzysearch';

import Icon from 'components/Icon/Icon';

require('./pageAutocomplete.scss');

type Item = {
	id: string;
	title: string;
	slug: string;
};

type Props = {
	items: Item[];
	usedItems: Item[];
	onSelect: (item: Item) => any;
	placeholder: string;
};

type State = {
	filteredItems: Item[];
	query: string;
};

class PageAutocomplete extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.getFilteredItems = this.getFilteredItems.bind(this);
		this.state = {
			filteredItems: this.getFilteredItems(props, ''),
			query: '',
		};
		this.filterItems = this.filterItems.bind(this);
		this.handleSelect = this.handleSelect.bind(this);
	}

	UNSAFE_componentWillReceiveProps(nextProps: Props) {
		this.setState({
			filteredItems: this.getFilteredItems(nextProps, ''),
		});
	}

	getFilteredItems(props, query) {
		const usedIndexes = props.usedItems.map((item) => {
			return item.id;
		});
		return props.items
			.filter((item) => {
				const fuzzyMatchName = fuzzysearch(query.toLowerCase(), item.title.toLowerCase());
				const fuzzyMatchSlug = fuzzysearch(query.toLowerCase(), item.slug.toLowerCase());
				const alreadyUsed = usedIndexes.indexOf(item.id) > -1;
				return item.slug && !alreadyUsed && (fuzzyMatchName || fuzzyMatchSlug);
			})
			.sort((foo, bar) => {
				if (foo.title < bar.title) {
					return -1;
				}
				if (foo.title > bar.title) {
					return 1;
				}
				return 0;
			});
	}

	filterItems(query) {
		const filteredItems = this.getFilteredItems(this.props, query);
		this.setState({
			query,
			filteredItems,
		});
	}

	handleSelect(data) {
		this.props.onSelect(data);
		this.filterItems('');
	}

	render() {
		return (
			<div className="page-autocomplete-component">
				<Suggest
					className="input"
					items={this.state.filteredItems}
					inputProps={{
						placeholder: this.props.placeholder,
						rightElement: <Icon icon="caret-down" />,
						small: true,
					}}
					query={this.state.query}
					onQueryChange={this.filterItems}
					// @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
					inputValueRenderer={() => {}}
					itemRenderer={(item, { handleClick, modifiers }) => {
						return (
							<li key={item.id}>
								<span
									role="button"
									tabIndex={-1}
									onClick={handleClick}
									className={
										modifiers.active
											? 'bp3-menu-item bp3-active'
											: 'bp3-menu-item'
									}
								>
									<span className="title">{item.title}</span>
								</span>
							</li>
						);
					}}
					onItemSelect={this.handleSelect}
					resetOnSelect={true}
					noResults={<MenuItem disabled text="No results" />}
					popoverProps={{
						minimal: true,
						position: Position.BOTTOM_LEFT,
						modifiers: {
							preventOverflow: { enabled: false },
							hide: { enabled: false },
							flip: { enabled: false },
						},
					}}
				/>
			</div>
		);
	}
}
export default PageAutocomplete;
