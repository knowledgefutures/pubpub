import React from 'react';
import { Checkbox, InputGroup, MenuItem, Position, Tag } from '@blueprintjs/core';
import { MultiSelect } from '@blueprintjs/select';

import { getFilteredRoles } from './roles';

type Props = {
	attribution: {
		affiliation?: string;
		id?: string;
		isAuthor?: boolean;
		orcid?: string;
	};
	isShadowAttribution: boolean;
	roles: any[];
	listOnBylineText: boolean;
	onAttributionUpdate: (...args: any[]) => any;
};

const AttributionDetailControls = (props: Props) => {
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
						// @ts-expect-error ts-migrate(2339) FIXME: Property 'checked' does not exist on type 'EventTa... Remove this comment to see the full error message
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
						// @ts-expect-error ts-migrate(2322) FIXME: Type '""' is not assignable to type 'Element | und... Remove this comment to see the full error message
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
export default AttributionDetailControls;
