import React from 'react';
import classNames from 'classnames';
import { Button, Icon, Tag } from '@blueprintjs/core';

import { Avatar } from 'components';
import attributionType from 'types/attribution';

import AttributionDetailControls from './AttributionDetailControls';
import EditableAvatar from './EditableAvatar';

type OwnProps = {
	attribution: attributionType;
	canEdit: boolean;
	dragHandleProps?: {};
	isDragging?: boolean;
	onAttributionDelete: (...args: any[]) => any;
	onAttributionUpdate: (...args: any[]) => any;
	listOnBylineText: string;
};

const defaultProps = {
	dragHandleProps: null,
	isDragging: false,
};

type Props = OwnProps & typeof defaultProps;

const AttributionRow = (props: Props) => {
	const {
		attribution,
		canEdit,
		dragHandleProps,
		isDragging,
		onAttributionUpdate,
		onAttributionDelete,
	} = props;
	const { user, id, isAuthor } = attribution;
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'roles' does not exist on type 'never'.
	const roles = attribution.roles || [];

	// TODO(ian): This is a set of heuristics that should be replaced with a more reliable mechanism
	// for telling whether an attribution is a "shadow", meaning it isn't associated with a PubPub
	// account. Our long-running hack has been to augment these attribution objects with a fake
	// user property, but we almost certainly ought to do something else.
	const isShadowAttribution =
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'user' does not exist on type 'never'.
		!attribution.user ||
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'user' does not exist on type 'never'.
		attribution.user.isShadowUser ||
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'user' does not exist on type 'never'.
		attribution.user.id === attribution.id;

	const renderAvatar = () => {
		if (isShadowAttribution && canEdit) {
			return (
				<EditableAvatar
					width={50}
					attribution={attribution}
					// @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
					onUpdateAvatar={(avatar) => onAttributionUpdate({ id: id, avatar: avatar })}
				/>
			);
		}
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'initials' does not exist on type 'never'... Remove this comment to see the full error message
		return <Avatar width={50} initials={user.initials} avatar={user.avatar} />;
	};

	return (
		<div className={classNames('attribution-row', isDragging && 'is-dragging')}>
			{canEdit && (
				<Button
					small
					minimal
					className="delete-button"
					// @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
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
						{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'slug' does not exist on type 'never'. */}
						{user.slug ? (
							// @ts-expect-error ts-migrate(2339) FIXME: Property 'slug' does not exist on type 'never'.
							<a href={`/user/${user.slug}`} className="hoverline">
								{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'fullName' does not exist on type 'never'... Remove this comment to see the full error message */}
								{user.fullName}
							</a>
						) : (
							// @ts-expect-error ts-migrate(2339) FIXME: Property 'fullName' does not exist on type 'never'... Remove this comment to see the full error message
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
							Listed on byline
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
