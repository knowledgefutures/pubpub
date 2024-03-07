import React, { useState } from 'react';
import { Checkbox, Classes, InputGroup, MenuItem, Position, Tag } from '@blueprintjs/core';
import { MultiSelect } from '@blueprintjs/select';

import { AttributionWithUser } from 'types';
import { ORCID_ID_OR_URL_PATTERN } from 'utils/orcid';

import { getFilteredRoles } from './roles';
import InputField from '../InputField/InputField';

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

	const isOrcidInvalid = (input?: string | null) =>
		Boolean(input && !input.match(ORCID_ID_OR_URL_PATTERN));

	const [invalidOrcid, setInvalidOrcid] = useState(isOrcidInvalid(orcid));

	const onAttributionUpdateWithValidation = (newAttribution: Partial<AttributionWithUser>) => {
		if (isOrcidInvalid(newAttribution.orcid)) {
			setInvalidOrcid(true);
			return;
		}

		onAttributionUpdate(newAttribution);
	};

	return (
		<div className="detail-controls">
			<Checkbox
				checked={!!isAuthor}
				onChange={(evt) =>
					onAttributionUpdateWithValidation({
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
						onAttributionUpdateWithValidation({
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
					onAttributionUpdateWithValidation({
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
					defaultValue={affiliation ?? undefined}
					onKeyDown={(evt) => {
						if (evt.key === 'Enter') {
							evt.currentTarget.blur();
						}
					}}
					onBlur={(evt) =>
						onAttributionUpdateWithValidation({
							id,
							affiliation: evt.target.value.trim(),
						})
					}
				/>
				{isShadowAttribution && (
					<InputField
						// @ts-expect-error ts-migrate(2322) FIXME: Type '"" | Element | undefined' is not assignable ... Remove this comment to see the full error message
						rightElement={orcid && <Tag minimal>ORCID</Tag>}
						placeholder="ORCID"
						defaultValue={orcid ?? undefined}
						onChange={(evt) => {
							const input = evt.target.value;
							const orcidInvalidity = isOrcidInvalid(input);
							setInvalidOrcid(orcidInvalidity);

							if (!orcidInvalidity) {
								onAttributionUpdateWithValidation({
									id,
									orcid: input.trim(),
								});
							}
						}}
						onBlur={(evt) => {
							setInvalidOrcid(isOrcidInvalid(evt.target.value));
							onAttributionUpdateWithValidation({
								id,
								orcid: evt.target.value.trim(),
							});
						}}
						error={
							invalidOrcid
								? 'Invalid ORCID. Please enter a valid ORCID or leave the field blank.'
								: undefined
						}
					/>
				)}
			</div>
		</div>
	);
};
export default AttributionDetailControls;
