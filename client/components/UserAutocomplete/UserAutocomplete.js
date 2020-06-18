import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, Position } from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';

import { Avatar } from 'components';
import { apiFetch } from 'client/utils/apiFetch';

require('./userAutocomplete.scss');

const propTypes = {
	allowCustomUser: PropTypes.bool,
	onSelect: PropTypes.func,
	placeholder: PropTypes.string,
	usedUserIds: PropTypes.array,
};

const defaultProps = {
	allowCustomUser: false,
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
		this.handleSelect = this.handleSelect.bind(this);
	}

	componentDidUpdate(_, prevState) {
		const { queryValue } = this.state;
		if (queryValue !== prevState.queryValue) {
			apiFetch(`/api/search/users?q=${queryValue}`).then((result) => {
				const { usedUserIds } = this.props;
				this.setState({
					items: result.filter((item) => !usedUserIds.includes(item.id)),
				});
			});
		}
	}

	handleSelect(data) {
		this.props.onSelect(data);
		this.inputRef.focus();
	}

	render() {
		const { allowCustomUser } = this.props;
		const { queryValue, items } = this.state;

		const suggestableItems = queryValue
			? allowCustomUser
				? [{ name: queryValue }, ...items]
				: items
			: [];

		return (
			<div className="user-autocomplete-component">
				<Suggest
					className="input"
					items={suggestableItems}
					inputProps={{
						placeholder: this.props.placeholder,
						large: true,
						inputRef: (ref) => {
							this.inputRef = ref;
						},
					}}
					inputValueRenderer={() => {
						return '';
					}}
					onQueryChange={(query) => this.setState({ queryValue: query.trim() })}
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
					noResults={<MenuItem disabled text="No results" />}
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
			</div>
		);
	}
}

UserAutocomplete.propTypes = propTypes;
UserAutocomplete.defaultProps = defaultProps;
export default UserAutocomplete;
