import React from 'react';
import classNames from 'classnames';
import { Button, Icon, Tag } from '@blueprintjs/core';

import { Avatar } from 'components';
import { AttributionWithUser, Falsy } from 'types';

import AttributionDetailControls from './AttributionDetailControls';
import EditableAvatar from './EditableAvatar';

type Props = {
	attribution: AttributionWithUser;
	canEdit: boolean;
	dragHandleProps?: Falsy | {};
	isDragging?: boolean;
	onAttributionDelete: (...args: any[]) => any;
	onAttributionUpdate: (...args: any[]) => any;
	listOnBylineText: string;
};

const defaultProps = {
	dragHandleProps: null,
	isDragging: false,
};

const AttributionRow = (props: Props) => {
	const {
		attribution,
		canEdit,
		dragHandleProps = null,
		isDragging = false,
		onAttributionUpdate,
		onAttributionDelete,
	} = props;
	const { user, id, isAuthor } = attribution;
	const roles = attribution.roles || [];

	// TODO(ian): This is a set of heuristics that should be replaced with a more reliable mechanism
	// for telling whether an attribution is a "shadow", meaning it isn't associated with a PubPub
	// account. Our long-running hack has been to augment these attribution objects with a fake
	// user property, but we almost certainly ought to do something else.
	const isShadowAttribution =
		!attribution.user ||
		attribution.user.isShadowUser ||
		attribution.user.id === attribution.id;

	const renderAvatar = () => {
		if (isShadowAttribution && canEdit) {
			return (
				<EditableAvatar
					width={50}
					attribution={attribution}
					onUpdateAvatar={(avatar) => onAttributionUpdate({ id, avatar })}
				/>
			);
		}
		return <Avatar width={50} initials={user.initials} avatar={user.avatar} />;
	};

	return (
		<div className={classNames('attribution-row', isDragging && 'is-dragging')}>
			{canEdit && (
				<Button
					small
					minimal
					className="delete-button"
					onClick={() => onAttributionDelete(id)}
					icon="small-cross"
				/>
			)}
			{dragHandleProps && (
				<div {...dragHandleProps} className="drag-handle">
					<Icon icon="drag-handle-vertical" />
				</div>
			)}
			<div className="avatar-wrapper">{renderAvatar()}</div>
			<div className="content">
				<div className="top-content">
					<div className="name">
						{user.slug ? (
							<a href={`/user/${user.slug}`} className="hoverline">
								{user.fullName}
							</a>
						) : (
							<span>{user.fullName}</span>
						)}
					</div>
				</div>
				<div className="bottom-content">
					{!canEdit && isAuthor && (
						<span
							style={{
								marginRight: '1em',
							}}
						>
							Assigned byline attribution
						</span>
					)}
					{!canEdit &&
						roles.map((item) => {
							return (
								<Tag key={item} minimal intent="primary">
									{item}
								</Tag>
							);
						})}
					{canEdit && (
						<AttributionDetailControls
							{...props}
							roles={roles}
							isShadowAttribution={isShadowAttribution}
						/>
					)}
				</div>
			</div>
		</div>
	);
};
AttributionRow.defaultProps = defaultProps;
export default AttributionRow;
