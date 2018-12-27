import React from 'react';
import { storiesOf } from '@storybook/react';
import Header from 'components/Header/Header';
import AccentStyle from 'components/AccentStyle/AccentStyle';
import { accentDataDark, accentDataLight } from '../data';

const wrapperStyle = { margin: '1em', boxShadow: '0px 0px 1px rgba(0, 0, 0, 0.25)' };
const titleStyle = { margin: '1em 1em -0.5em' };

const headerBars = function(isBasePubPub) {
	const data = {
		userName: 'Maggie Farnkrux',
		userInitials: 'MF',
		userSlug: 'maggiefarn',
		userAvatar: 'https://assets.pubpub.org/mflaxicd/11505393046254.jpg',
		userIsAdmin: true,
		smallHeaderLogo: isBasePubPub
			? '/static/icon.png'
			: 'https://assets.pubpub.org/c7cfyyz6/31507218538557.png',
		largeHeaderLogo: 'https://assets.pubpub.org/c7cfyyz6/31507218538557.png',
		largeHeaderDescription: 'Group publications and research docs from around the world all situated here in this little community.',
		largeHeaderBackground: 'https://assets.pubpub.org/9s4gbj5y/51507218425793.png',
		isBasePubPub: isBasePubPub,
		isLandingPage: false,
		onLogout: ()=> {},
	};
	return (
		<div>
			<h4 style={titleStyle}>Logged Out</h4>
			<div style={wrapperStyle}>
				<Header
					smallHeaderLogo={data.smallHeaderLogo}
					onLogout={data.onLogout}
					isBasePubPub={data.isBasePubPub}
					isLandingPage={false}
				/>
			</div>

			<h4 style={titleStyle}>Logged In · User</h4>
			<div style={wrapperStyle}>
				<Header
					loginData={{
						fullName: data.userName,
						initials: data.userInitials,
						slug: data.userSlug,
						isAdmin: false
					}}
					smallHeaderLogo={data.smallHeaderLogo}
					onLogout={data.onLogout}
					isBasePubPub={data.isBasePubPub}
					isLandingPage={false}
				/>
			</div>

			<h4 style={titleStyle}>Logged In · Admin</h4>
			<div style={wrapperStyle}>
				<Header
					loginData={{
						fullName: data.userName,
						initials: data.userInitials,
						avatar: data.userAvatar,
						slug: data.userSlug,
						isAdmin: true
					}}
					smallHeaderLogo={data.smallHeaderLogo}
					onLogout={data.onLogout}
					isBasePubPub={data.isBasePubPub}
					isLandingPage={false}
				/>
			</div>

			{!isBasePubPub &&
				<div>
					<h4 style={titleStyle}>Home · No Background</h4>
					<div style={wrapperStyle}>
						<Header
							loginData={{
								fullName: data.userName,
								initials: data.userInitials,
								avatar: data.userAvatar,
								slug: data.userSlug,
								isAdmin: true
							}}
							smallHeaderLogo={data.smallHeaderLogo}
							largeHeaderLogo={data.largeHeaderLogo}
							largeHeaderDescription={data.largeHeaderDescription}
							onLogout={data.onLogout}
							isBasePubPub={data.isBasePubPub}
							isLandingPage={true}
						/>
					</div>

					<h4 style={titleStyle}>Home · Background (Image)</h4>
					<div style={wrapperStyle}>
						<Header
							loginData={{
								fullName: data.userName,
								initials: data.userInitials,
								avatar: data.userAvatar,
								slug: data.userSlug,
								isAdmin: true
							}}
							smallHeaderLogo={data.smallHeaderLogo}
							largeHeaderLogo={data.largeHeaderLogo}
							largeHeaderDescription={data.largeHeaderDescription}
							largeHeaderBackground={data.largeHeaderBackground}
							onLogout={data.onLogout}
							isBasePubPub={data.isBasePubPub}
							isLandingPage={true}
						/>
					</div>
				</div>
			}
		</div>
	);
};

storiesOf('Components/Header', module)
.add('PubPub', () => (
	<div>
		{headerBars(true)}
	</div>
))
.add('Dark', () => (
	<div>
		<AccentStyle {...accentDataDark} />
		{headerBars()}
	</div>
))
.add('Light', () => (
	<div>
		<AccentStyle {...accentDataLight} />
		{headerBars()}
	</div>
));
