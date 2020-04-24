import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Spinner } from '@blueprintjs/core';
import { Button as RKButton } from 'reakit/Button';

import { Avatar, ImageUpload, Icon } from 'components';

require('./editableAvatar.scss');

const propTypes = {
	attribution: PropTypes.shape({
		avatar: PropTypes.string,
		user: PropTypes.shape({
			initials: PropTypes.string,
		}),
	}).isRequired,
	onUpdateAvatar: PropTypes.func.isRequired,
	width: PropTypes.number.isRequired,
};

const EditableAvatar = (props) => {
	const {
		attribution: { avatar, user },
		onUpdateAvatar,
		width,
	} = props;

	const [isLoading, setIsLoading] = useState(false);

	const handleImageSelect = () => {
		setIsLoading(true);
	};

	const handleNewImage = (image) => {
		setIsLoading(false);
		onUpdateAvatar(image);
	};

	// eslint-disable-next-line react/prop-types
	const renderControls = ({ selectImage, clearImage }) => {
		return (
			<>
				<RKButton
					aria-label="Upload avatar image"
					as="div"
					className="avatar-button"
					style={{ borderRadius: width / 2 }}
					onClick={selectImage}
				>
					<Avatar width={width} initials={user.initials} avatar={avatar} />
					<div
						className={classNames(
							'hover-overlay',
							!avatar && 'no-image',
							isLoading && 'is-loading',
						)}
					>
						{isLoading && <Spinner size={width / 2} />}
						{!isLoading && <Icon icon="add" iconSize={width / 2.25} />}
					</div>
				</RKButton>
				{avatar && (
					<Button
						aria-label="Remove avatar image"
						small
						className="remove-button"
						icon={<Icon icon="trash" iconSize={12} />}
						intent="danger"
						onClick={clearImage}
					/>
				)}
			</>
		);
	};

	return (
		<div className="editable-avatar-component">
			<ImageUpload onImageSelect={handleImageSelect} onNewImage={handleNewImage}>
				{renderControls}
			</ImageUpload>
		</div>
	);
};

EditableAvatar.propTypes = propTypes;
export default EditableAvatar;
