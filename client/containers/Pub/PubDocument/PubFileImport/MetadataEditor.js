import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Checkbox, InputGroup, TextArea } from '@blueprintjs/core';

import { Avatar } from 'components';
import { MenuButton, MenuItem } from 'components/Menu';
import { usePageContext } from 'utils/hooks';
import { profileUrl } from 'utils/canonicalUrls';
import { getPartsOfFullName } from 'utils/names';
import { apiFetch } from 'client/utils/apiFetch';

import { usePubContext } from '../../pubHooks';

require('./metadataEditor.scss');

const attributionShape = PropTypes.shape({
	name: PropTypes.string,
	users: PropTypes.arrayOf(PropTypes.shape({})),
});

const propTypes = {
	onSetMetadataUpdater: PropTypes.func.isRequired,
	proposedMetadata: PropTypes.shape({
		attributions: PropTypes.arrayOf(attributionShape),
	}).isRequired,
};

const ProposedAttribution = ({ attribution, onUpdateAttribution }) => {
	const { name, users, matchedUser, ignored } = attribution;

	const handleToggleIgnored = () => {
		if (ignored) {
			onUpdateAttribution({ ignored: false });
		} else {
			onUpdateAttribution({ ignored: true, matchedUser: null });
		}
	};

	const rendermatchedUsersMenu = () => {
		if (!users || users.length === 0 || ignored) {
			return null;
		}

		if (matchedUser) {
			return (
				<Button small minimal onClick={() => onUpdateAttribution({ matchedUser: null })}>
					Unmatch user
				</Button>
			);
		}

		return (
			<MenuButton
				aria-label="Match to PubPub user"
				buttonProps={{
					minimal: true,
					small: true,
					rightIcon: 'chevron-down',
					icon: (
						<span className="matched-users-avatars">
							{users.slice(0, 3).map((user) => (
								<Avatar
									width={20}
									avatar={user.avatar}
									borderColor="white"
									doesOverlap={true}
								/>
							))}
						</span>
					),
				}}
				buttonContent={`${users.length} matching ${users.length === 1 ? 'user' : 'users'}`}
				placement="bottom-end"
			>
				{users.map((user) => (
					<MenuItem
						text={user.fullName}
						icon={<Avatar width={20} avatar={user.avatar} initials={user.initials} />}
						key={user.id}
						onClick={() => onUpdateAttribution({ matchedUser: user })}
					/>
				))}
			</MenuButton>
		);
	};

	const renderToggleIgnoredButton = () => {
		return (
			<Button
				aria-label={
					ignored
						? `Add ${name} to Pub attribution`
						: `Remove ${name} from Pub attribution`
				}
				onClick={handleToggleIgnored}
				icon={ignored ? 'small-plus' : 'small-cross'}
				small
				minimal
			/>
		);
	};

	const renderName = () => {
		if (matchedUser) {
			return (
				<a href={profileUrl(matchedUser.slug)} target="_blank" rel="noopener noreferrer">
					{matchedUser.fullName}
				</a>
			);
		}
		return name;
	};

	return (
		<div className="proposed-attribution">
			<Avatar
				width={20}
				initials={matchedUser ? matchedUser.initials : getPartsOfFullName(name).initials}
				avatar={matchedUser && matchedUser.avatar}
			/>
			<div className={classNames('name', ignored && 'ignored')}>{renderName()}</div>
			<div className="controls">
				{rendermatchedUsersMenu()}
				{renderToggleIgnoredButton()}
			</div>
		</div>
	);
};

ProposedAttribution.propTypes = {
	attribution: attributionShape.isRequired,
	onUpdateAttribution: PropTypes.func.isRequired,
};

const MetadataEditor = (props) => {
	const { onSetMetadataUpdater, proposedMetadata } = props;
	const [metadata, setMetadata] = useState(proposedMetadata);
	const { communityData } = usePageContext();
	const { pubData, updatePubData } = usePubContext();
	const [ignoredFields, setIgnoredFields] = useState({});
	const { attributions, ...pubFields } = metadata;

	useEffect(() => {
		setMetadata(proposedMetadata);
		setIgnoredFields({});
	}, [proposedMetadata]);

	useEffect(() => {
		const persistUpdatedPubData = async () => {
			const updatedPubData = {};
			Object.keys(pubFields).forEach((key) => {
				if (!ignoredFields[key]) {
					updatedPubData[key] = pubFields[key];
				}
			});
			if (Object.keys(updatedPubData).length > 0) {
				await apiFetch.put('/api/pubs', {
					pubId: pubData.id,
					communityId: communityData.id,
					...updatedPubData,
				});
				updatePubData(updatedPubData);
			}
		};

		const persistPubAttributions = async () => {
			if (attributions) {
				const newAttributions = attributions
					.filter((attr) => !attr.ignored)
					.map(({ name, matchedUser }) => {
						return {
							name: name,
							userId: matchedUser && matchedUser.id,
							isAuthor: true,
						};
					});
				if (newAttributions.length > 0) {
					const updatedAttributions = await apiFetch.post('/api/pubAttributions/batch', {
						communityId: communityData.id,
						pubId: pubData.id,
						attributions: newAttributions,
					});
					updatePubData({ attributions: updatedAttributions });
				}
			}
		};

		onSetMetadataUpdater(() => () =>
			Promise.all([persistUpdatedPubData(), persistPubAttributions()]),
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ignoredFields, metadata]);

	const handleUpdateAttribution = (attrIndex, nextValue) => {
		const nextAttributions = attributions.concat();
		nextAttributions.splice(attrIndex, 1, { ...attributions[attrIndex], ...nextValue });
		setMetadata({
			...metadata,
			attributions: nextAttributions,
		});
	};

	const renderFreeformFieldEntry = (pubDataFieldName, useTextarea = false) => {
		const EntryComponent = useTextarea ? TextArea : InputGroup;
		const currentValue = metadata[pubDataFieldName];
		const currentlyIgnored = ignoredFields[pubDataFieldName];
		if (currentValue === null || currentValue === undefined) {
			return null;
		}
		return (
			<div className="field-entry">
				<Checkbox
					checked={!currentlyIgnored}
					label={`Use imported ${pubDataFieldName}`}
					onChange={() =>
						setIgnoredFields((current) => ({
							...current,
							[pubDataFieldName]: !currentlyIgnored,
						}))
					}
				/>
				<EntryComponent
					disabled={currentlyIgnored}
					value={currentValue}
					onChange={(evt) => {
						const { value } = evt.target;
						setMetadata((current) => ({
							...current,
							[pubDataFieldName]: value,
						}));
					}}
				/>
			</div>
		);
	};

	const renderAttributions = () => {
		if (attributions && attributions.length) {
			return (
				<>
					<h6>Authors</h6>
					{attributions.map((attr, index) => (
						<ProposedAttribution
							// eslint-disable-next-line react/no-array-index-key
							key={index}
							attribution={attr}
							onUpdateAttribution={(value) => handleUpdateAttribution(index, value)}
						/>
					))}
				</>
			);
		}
		return null;
	};

	return (
		<div className="metadata-editor-component">
			<h6>Metadata</h6>
			{renderFreeformFieldEntry('title')}
			{renderFreeformFieldEntry('description')}
			{renderAttributions()}
		</div>
	);
};

MetadataEditor.propTypes = propTypes;
export default MetadataEditor;
