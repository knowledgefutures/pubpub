import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, Position } from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';
import Avatar from 'components/Avatar/Avatar';
import { apiFetch } from 'utils';

require('./userAutocomplete.scss');

const propTypes = {
	allowCustomUser: PropTypes.bool,
	disabled: PropTypes.bool,
	onSelect: PropTypes.func,
	placeholder: PropTypes.string,
	usedUserIds: PropTypes.array,
};

const defaultProps = {
	allowCustomUser: false,
	disabled: false,
	onSelect: () => {},
	placeholder: 'Search for users...',
	usedUserIds: [],
};

class UserAutocomplete extends Component {
	constructor(props) {
		super(props);
		this.state = {
			items: [],
			queryValue: '',
		};
		this.inputRef = undefined;
		this.filterItems = this.filterItems.bind(this);
		this.handleSelect = this.handleSelect.bind(this);
	}

	filterItems(query) {
		if (!query) {
			this.setState({ queryValue: query });
			return [];
		}
		if (query !== this.state.queryValue) {
			this.setState({ queryValue: query });
			apiFetch(`/api/search/users?q=${query}`)
				.then((result) => {
					const appendedResult =
						this.props.allowCustomUser && query
							? [
									{
										name: query,
									},
									...result,
							  ]
							: result;
					this.setState({
						items: appendedResult.filter((item) => {
							return this.props.usedUserIds.indexOf(item.id) === -1;
						}),
					});
				})
				.catch((error) => {
					console.error(error);
				});
		}
		return this.state.items;
	}

	handleSelect(data) {
		this.props.onSelect(data);
		this.inputRef.focus();
	}

	render() {
		return (
			<Suggest
				className="user-autocomplete-component"
				items={this.state.items}
				inputProps={{
					disabled: this.props.disabled,
					placeholder: this.props.placeholder,
					large: true,
					inputRef: (ref) => {
						this.inputRef = ref;
					},
				}}
				itemListPredicate={this.filterItems}
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
									modifiers.active ? 'bp3-menu-item bp3-active' : 'bp3-menu-item'
								}
							>
								{item.fullName && (
									<Avatar
										initials={item.initials}
										avatar={item.avatar}
										width={25}
									/>
								)}
								{item.name && <span>Add collaborator named: </span>}
								<span className="autocomplete-name">
									{item.name || item.fullName}
								</span>
							</button>
						</li>
					);
				}}
				resetOnSelect={true}
				onItemSelect={this.handleSelect}
				noResults={this.state.queryValue ? <MenuItem disabled text="No results" /> : null}
				popoverProps={{
					popoverClassName: 'user-autocomplete-popover',
					minimal: true,
					position: Position.BOTTOM_LEFT,
					modifiers: {
						preventOverflow: { enabled: false },
						hide: { enabled: false },
					},
				}}
			/>
		);
	}
}

UserAutocomplete.propTypes = propTypes;
UserAutocomplete.defaultProps = defaultProps;
export default UserAutocomplete;
