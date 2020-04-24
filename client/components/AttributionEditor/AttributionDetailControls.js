import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox, InputGroup, MenuItem, Position, Tag } from '@blueprintjs/core';
import { MultiSelect } from '@blueprintjs/select';

import { getFilteredRoles } from './roles';

const propTypes = {
	attribution: PropTypes.shape({
		affiliation: PropTypes.string,
		id: PropTypes.string,
		isAuthor: PropTypes.bool,
		orcid: PropTypes.string,
	}).isRequired,
	isShadowAttribution: PropTypes.bool.isRequired,
	roles: PropTypes.array.isRequired,
	listOnBylineText: PropTypes.bool.isRequired,
	onAttributionUpdate: PropTypes.func.isRequired,
};

const AttributionDetailControls = (props) => {
	const {
		attribution,
		isShadowAttribution,
		listOnBylineText,
		onAttributionUpdate,
		roles,
	} = props;
	const { affiliation, id, isAuthor, orcid } = attribution;

	return (
		<div className="detail-controls">
			<Checkbox
				checked={isAuthor}
				onChange={(evt) =>
					onAttributionUpdate({
						id: id,
						isAuthor: evt.target.checked,
					})
				}
			>
				{listOnBylineText}
			</Checkbox>
			<MultiSelect
				className="roles"
				items={roles}
				itemListPredicate={getFilteredRoles}
				itemRenderer={(item, { handleClick, modifiers }) => {
					return <MenuItem onClick={handleClick} active={modifiers.active} text={item} />;
				}}
				selectedItems={roles}
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
					const existingRoles = roles;
					const newRoles = [...existingRoles, newRole];
					onAttributionUpdate({
						id: id,
						roles: newRoles,
					});
				}}
				noResults={<MenuItem disabled>No Matching Roles</MenuItem>}
				popoverProps={{
					popoverClassName: 'bp3-minimal',
					position: Position.BOTTOM_LEFT,
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
			<div className="right-details">
				<InputGroup
					placeholder="Affiliation"
					defaultValue={affiliation}
					onKeyDown={(evt) => {
						if (evt.key === 'Enter') {
							evt.currentTarget.blur();
						}
					}}
					onBlur={(evt) =>
						onAttributionUpdate({
							id: id,
							affiliation: evt.target.value.trim(),
						})
					}
				/>
				{isShadowAttribution && (
					<InputGroup
						rightElement={orcid && <Tag minimal>ORCID</Tag>}
						placeholder="ORCID"
						defaultValue={orcid}
						onKeyDown={(evt) => {
							if (evt.key === 'Enter') {
								evt.currentTarget.blur();
							}
						}}
						onBlur={(evt) =>
							onAttributionUpdate({
								id: id,
								orcid: evt.target.value.trim(),
							})
						}
					/>
				)}
			</div>
		</div>
	);
};

AttributionDetailControls.propTypes = propTypes;
export default AttributionDetailControls;
