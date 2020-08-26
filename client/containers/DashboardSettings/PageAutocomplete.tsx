/* eslint-disable react/no-unused-prop-types */
import React, { Component } from 'react';
import { MenuItem, Position } from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';
import fuzzysearch from 'fuzzysearch';

import Icon from 'components/Icon/Icon';
import { generateHash } from 'utils/hashes';

require('./pageAutocomplete.scss');

type OwnProps = {
	pages: any[];
	usedItems?: any[];
	onSelect?: (...args: any[]) => any;
	placeholder?: string;
	allowCustom?: boolean;
};

const defaultProps = {
	usedItems: [],
	onSelect: () => {},
	placeholder: 'Create Dropdown or Add Page...',
	allowCustom: false,
};

type State = any;

type Props = OwnProps & typeof defaultProps;

class PageAutocomplete extends Component<Props, State> {
	static defaultProps = defaultProps;

	constructor(props: Props) {
		super(props);
		this.getFilteredItems = this.getFilteredItems.bind(this);
		this.state = {
			items: this.getFilteredItems(props, ''),
			value: '',
		};
		this.filterItems = this.filterItems.bind(this);
		this.handleSelect = this.handleSelect.bind(this);
	}

	componentWillReceiveProps(nextProps: Props) {
		this.setState({
			items: this.getFilteredItems(nextProps, ''),
		});
	}

	getFilteredItems(props, query) {
		const usedIndexes = props.usedItems.map((item) => {
			return item.id;
		});
		return props.pages
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
		const createOption = {
			title: query,
			children: [],
			id: generateHash(8),
		};
		const outputItems =
			query && this.props.allowCustom ? [...filteredItems, createOption] : filteredItems;
		this.setState({
			value: query,
			items: outputItems,
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
					items={this.state.items}
					inputProps={{
						placeholder: this.props.placeholder,
						rightElement: <Icon icon="caret-down" />,
						small: true,
					}}
					query={this.state.value}
					onQueryChange={this.filterItems}
					// @ts-expect-error ts-migrate(2769) FIXME: Type '() => void' is not assignable to type '(item... Remove this comment to see the full error message
					inputValueRenderer={() => {}}
					itemRenderer={(item = {}, { handleClick, modifiers }) => {
						return (
							<li key={item.id || 'empty-user-create'}>
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
									{item.children && (
										<span className="new-title">Create dropdown group:</span>
									)}
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
