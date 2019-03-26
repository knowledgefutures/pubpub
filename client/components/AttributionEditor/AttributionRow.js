import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Checkbox, Icon, Position } from '@blueprintjs/core';
import { MultiSelect } from '@blueprintjs/select';

import Avatar from 'components/Avatar/Avatar';
import attributionType from 'types/attribution';

import { getFilteredRoles } from './roles';

const addFallbackUser = (attribution) => {
	if (attribution.user) {
		return attribution;
	}
	return {
		...attribution,
		user: {
			id: attribution.id,
			initials: attribution.name[0],
			fullName: attribution.name,
			firstName: attribution.name.split(' ')[0],
			lastName: attribution.name
				.split(' ')
				.slice(1, attribution.name.split(' ').length)
				.join(' '),
			avatar: attribution.avatar,
			title: attribution.title,
		},
	};
};

const propTypes = {
	attribution: attributionType.isRequired,
	canEdit: PropTypes.bool.isRequired,
	dragHandleProps: PropTypes.shape({}),
	isDragging: PropTypes.bool,
	onAttributionDelete: PropTypes.func.isRequired,
	onAttributionUpdate: PropTypes.func.isRequired,
};

const defaultProps = {
	dragHandleProps: null,
	isDragging: false,
};

const AttributionRow = (props) => {
	const {
		canEdit,
		dragHandleProps,
		isDragging,
		onAttributionDelete,
		onAttributionUpdate,
	} = props;
	const { user, id, isAuthor, roles } = addFallbackUser(props.attribution);
	return (
		<div className={classNames('attribution-row', isDragging && 'is-dragging')}>
			{dragHandleProps && (
				<div {...dragHandleProps} className="drag-handle">
					<Icon icon="drag-handle-vertical" />
				</div>
			)}
			<div className="avatar-wrapper">
				<Avatar width={50} userInitials={user.initials} userAvatar={user.avatar} />
			</div>
			<div className="content">
				<div className="top-content">
					<div className="name">
						{user.slug ? (
							<a href={`/user/${user.slug}`} className="underline-on-hover">
								{user.fullName}
							</a>
						) : (
							<span>{user.fullName}</span>
						)}
					</div>
					{canEdit && (
						<button
							className="bp3-button bp3-minimal"
							type="button"
							onClick={() => onAttributionDelete(id)}
						>
							<span className="bp3-icon-standard bp3-icon-small-cross" />
						</button>
					)}
				</div>
				<div className="bottom-content">
					{!canEdit && isAuthor && (
						<span
							style={{
								marginRight: '1em',
							}}
						>
							Listed on byline
						</span>
					)}
					{!canEdit &&
						roles.map((item) => {
							return (
								<span key={item} className="bp3-tag bp3-minimal bp3-intent-primary">
									{item}
								</span>
							);
						})}
					{canEdit && (
						<Checkbox
							checked={isAuthor}
							onChange={(evt) =>
								onAttributionUpdate({
									id: id,
									isAuthor: evt.target.checked,
								})
							}
						>
							List on byline
						</Checkbox>
					)}
					{canEdit && (
						<MultiSelect
							items={roles || []}
							itemListPredicate={getFilteredRoles}
							itemRenderer={(item, { handleClick, modifiers }) => {
								return (
									<li key={item}>
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
											{item}
										</button>
									</li>
								);
							}}
							selectedItems={roles || []}
							tagRenderer={(item) => {
								return <span>{item}</span>;
							}}
							tagInputProps={{
								onRemove: (evt, roleIndex) => {
									const newRoles = roles.filter((_, filterIndex) => {
										return filterIndex !== roleIndex;
									});
									onAttributionUpdate({
										id: id,
										roles: newRoles,
									});
								},
								placeholder: 'Add roles...',
								tagProps: {
									className: 'bp3-minimal bp3-intent-primary',
								},
								inputProps: {
									placeholder: 'Add roles...',
								},
							}}
							resetOnSelect={true}
							onItemSelect={(newRole) => {
								const existingRoles = roles || [];
								const newRoles = [...existingRoles, newRole];
								onAttributionUpdate({
									id: id,
									roles: newRoles,
								});
							}}
							noResults={<div className="bp3-menu-item">No Matching Roles</div>}
							popoverProps={{
								popoverClassName: 'bp3-minimal',
								position: Position.BOTTOM_LEFT,
								usePortal: false,
								modifiers: {
									preventOverflow: {
										enabled: false,
									},
									hide: {
										enabled: false,
									},
									flip: {
										enabled: false,
									},
								},
							}}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

AttributionRow.propTypes = propTypes;
AttributionRow.defaultProps = defaultProps;
export default AttributionRow;
