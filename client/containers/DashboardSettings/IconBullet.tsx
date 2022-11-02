import React from 'react';
import classNames from 'classnames';

import { Icon, IconName } from 'components';
import { PubPubIconName } from 'client/utils/icons';

require('./iconBullet.scss');

type Props = {
	selected?: boolean;
	small?: boolean;
} & ({ icon: IconName } | { pubPubIcon: PubPubIconName });

const IconBullet = (props: Props) => {
	const { selected, small, ...iconProps } = props;
	return (
		<div
			className={classNames(
				'icon-bullet-component',
				selected && 'selected',
				small && 'small',
			)}
		>
			<div className="background-circle" />
			<Icon iconSize={16} {...iconProps} />
		</div>
	);
};

export default IconBullet;
