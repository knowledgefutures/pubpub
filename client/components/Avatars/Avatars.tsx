import React from 'react';
import classNames from 'classnames';

import { MinimalUser } from 'types';
import Avatar from '../Avatar/Avatar';

require('./avatars.scss');

type Props = {
	users: MinimalUser[];
	className?: string;
	truncateAt?: number;
	size?: number;
	borderColor?: string;
	borderWidth?: number;
};

const getTruncation = (users: MinimalUser[], truncateAt: number | undefined) => {
	if (truncateAt && users.length > truncateAt) {
		return {
			users: users.slice(0, truncateAt),
			overflow: users.length - truncateAt,
		};
	}
	return { users, overflow: null };
};

const Avatars = (props: Props) => {
	const { className, truncateAt, size = 22, borderColor = '#eee', borderWidth = 2 } = props;
	const { users, overflow } = getTruncation(props.users, truncateAt);

	if (users.length === 0) {
		return null;
	}

	return (
		<div className={classNames('avatars-component', className)}>
			{users.map((user, index) => (
				<Avatar
					initials={user.initials}
					avatar={user.avatar}
					key={user.id}
					instanceNumber={index}
					width={size}
					borderWidth={borderWidth}
					borderColor={borderColor}
					doesOverlap
				/>
			))}
			{overflow && <div className="overflow">+{overflow}</div>}
		</div>
	);
};

export default Avatars;
