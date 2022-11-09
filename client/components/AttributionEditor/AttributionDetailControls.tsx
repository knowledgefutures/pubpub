import React from 'react';
import { Checkbox, Classes, InputGroup, MenuItem, Position, Tag } from '@blueprintjs/core';
import { MultiSelect } from '@blueprintjs/select';

import { AttributionWithUser } from 'types';

import { getFilteredRoles } from './roles';

type Props = {
	attribution: AttributionWithUser;
	isShadowAttribution: boolean;
	roles: string[];
	listOnBylineText: string;
	onAttributionUpdate: (...args: any[]) => any;
};

const AttributionDetailControls = (props: Props) => {
	const { attribution, isShadowAttribution, listOnBylineText, onAttributionUpdate, roles } =
		props;
	const { affiliation, id, isAuthor, orcid } = attribution;

	return (
		<div className="detail-controls">
			<Checkbox
				checked={isAuthor}
				onChange={(evt) =>
					onAttributionUpdate({
						id,
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
					return (
						<MenuItem
							key={item}
							onClick={handleClick}
							active={modifiers.active}
							text={item}
						/>
					);
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
							id,
							roles: newRoles,
						});
					},
					placeholder: 'Add roles...',
					tagProps: {
						className: `${Classes.MINIMAL} ${Classes.INTENT_PRIMARY}`,
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
						id,
						roles: newRoles,
					});
				}}
				noResults={<MenuItem disabled>No Matching Roles</MenuItem>}
				popoverProps={{
					popoverClassName: Classes.MINIMAL,
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
							id,
							affiliation: evt.target.value.trim(),
						})
					}
				/>
				{isShadowAttribution && (
					<InputGroup
						// @ts-expect-error ts-migrate(2322) FIXME: Type '"" | Element | undefined' is not assignable ... Remove this comment to see the full error message
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
								id,
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
