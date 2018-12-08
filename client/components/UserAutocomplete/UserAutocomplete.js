import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, Position } from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';
import Avatar from 'components/Avatar/Avatar';
import { apiFetch } from 'utilities';

require('./userAutocomplete.scss');

const propTypes = {
	onSelect: PropTypes.func,
	placeholder: PropTypes.string,
	usedUserIds: PropTypes.array,
	allowCustomUser: PropTypes.bool,
};

const defaultProps = {
	onSelect: ()=>{},
	placeholder: 'Search for users...',
	usedUserIds: [],
	allowCustomUser: false,
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
				const appendedResult = this.props.allowCustomUser && query
					? [
						{
							name: query,
						},
						...result,
					]
					: result;
				this.setState({
					items: appendedResult.filter((item)=> {
						return this.props.usedUserIds.indexOf(item.id) === -1;
					})
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
			<div className="user-autocomplete-component">
				<Suggest
					className="input"
					items={this.state.items}
					inputProps={{
						placeholder: this.props.placeholder,
						className: 'bp3-large',
						inputRef: (ref)=> { this.inputRef = ref; },
					}}
					itemListPredicate={this.filterItems}
					inputValueRenderer={()=> { return ''; }}
					itemRenderer={(item, { handleClick, modifiers })=> {
						return (
							<li key={item.id || 'empty-user-create'}>
								<button
									type="button"
									tabIndex={-1}
									onClick={handleClick}
									className={modifiers.active ? 'bp3-menu-item bp3-active' : 'bp3-menu-item'}
								>
									{item.fullName && <Avatar userInitials={item.initials} userAvatar={item.avatar} width={25} />}
									{item.name && <span>Add collaborator named: </span>}
									<span className="autocomplete-name">{item.name || item.fullName}</span>
								</button>
							</li>
						);
					}}
					closeOnSelect={true}
					onItemSelect={this.handleSelect}
					noResults={<MenuItem disabled text="No results" />}
					popoverProps={{
						isOpen: this.state.queryValue,
						popoverClassName: 'bp3-minimal user-autocomplete-popover',
						position: Position.BOTTOM_LEFT,
						modifiers: {
							preventOverflow: { enabled: false },
							hide: { enabled: false },
						},
					}}
				/>
			</div>
		);
	}
}

UserAutocomplete.propTypes = propTypes;
UserAutocomplete.defaultProps = defaultProps;
export default UserAutocomplete;
