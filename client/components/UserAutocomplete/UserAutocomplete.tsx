import React, { Component } from 'react';
import { Classes, MenuItem, Position } from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';

import { Avatar } from 'components';
import { apiFetch } from 'client/utils/apiFetch';

require('./userAutocomplete.scss');

type OwnProps = {
	allowCustomUser?: boolean;
	onSelect?: (...args: any[]) => any;
	placeholder?: string;
	usedUserIds?: any[];
};

const defaultProps = {
	allowCustomUser: false,
	onSelect: () => {},
	placeholder: 'Search for users...',
	usedUserIds: [],
};

type State = any;

type Props = OwnProps & typeof defaultProps;

class UserAutocomplete extends Component<Props, State> {
	static defaultProps = defaultProps;

	constructor(props: Props) {
		super(props);
		this.state = {
			items: [],
			queryValue: '',
		};
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'inputRef' does not exist on type 'UserAu... Remove this comment to see the full error message
		this.inputRef = undefined;
		this.handleSelect = this.handleSelect.bind(this);
	}

	componentDidUpdate(_: Props, prevState: State) {
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
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'inputRef' does not exist on type 'UserAu... Remove this comment to see the full error message
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
							// @ts-expect-error ts-migrate(2339) FIXME: Property 'inputRef' does not exist on type 'UserAu... Remove this comment to see the full error message
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
											? `${Classes.MENU_ITEM} ${Classes.ACTIVE}`
											: Classes.MENU_ITEM
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
					noResults={queryValue ? <MenuItem disabled text="No results" /> : null}
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
export default UserAutocomplete;
