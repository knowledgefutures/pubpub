import React from 'react';
import classNames from 'classnames';

import { Icon } from 'components';

require('./step.scss');

type Props = {
	children: React.ReactNode;
	className: string;
	done?: boolean;
	number: number;
	title: React.ReactNode;
};

const Step = (props: Props) => {
	const { title, number, children, className, done } = props;
	return (
		<div className={classNames('step-component', className)}>
			<h2>
				<span className={classNames('number', done && 'done')}>
					{done ? <Icon icon="tick" /> : number}
				</span>
				{title}
			</h2>
			{children}
		</div>
	);
};

export default Step;
