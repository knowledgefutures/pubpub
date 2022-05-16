import React from 'react';
import { storiesOf } from '@storybook/react';

import { usePageContext } from 'utils/hooks';

import GlobalControls from './GlobalControls';

type Props = Omit<React.ComponentProps<typeof GlobalControls>, 'onCreatePub' | 'onLogout'> & {
	title: string;
};

const WrappedGlobalControls = (props: Props) => {
	const { title, ...restProps } = props;
	const { communityData } = usePageContext();
	return (
		<div style={{ marginBottom: '1em' }} className="accent-color">
			<h4>{title}</h4>
			<div
				style={{
					width: '100%',
					backgroundColor: communityData.accentColorDark,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'flex-end',
					minHeight: '40px',
				}}
			>
				<GlobalControls {...restProps} />
			</div>
		</div>
	);
};

storiesOf('components/GlobalControls', module).add('default', () => (
	<>
		<WrappedGlobalControls loggedIn={true} title="Logged in" />
		<WrappedGlobalControls loggedIn={false} title="Logged out" />
		<WrappedGlobalControls isBasePubPub loggedIn={true} title="Logged in (base)" />
		<WrappedGlobalControls isBasePubPub loggedIn={false} title="Logged out (base)" />
	</>
));
