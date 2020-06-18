// import React from 'react';
// import { storiesOf } from '@storybook/react';
// import NavBar from 'components/NavBar/NavBar';
// import AccentStyle from 'components/AccentStyle/AccentStyle';
// import { populateNavigationIds } from 'utils/community';
// import { communityData, accentDataDark, accentDataLight } from 'utils/storybook/data';

// const navItems = populateNavigationIds(communityData.collections, communityData.navigation);

// const wrapperStyle = { margin: '1em', boxShadow: '0px 0px 1px rgba(0, 0, 0, 0.25)' };
// const titleStyle = { margin: '1em 1em -0.5em' };

// const emptyItems = [];
// const fewItems = [...navItems].slice(0, 5);
// const manyItems = [...navItems];

// const navBars = (
// 	<div>
// 		<h4 style={titleStyle}>No Items</h4>
// 		<div style={wrapperStyle}>
// 			<NavBar navItems={emptyItems} />
// 		</div>

// 		<h4 style={titleStyle}>Few Items</h4>
// 		<div style={wrapperStyle}>
// 			<NavBar navItems={fewItems} />
// 		</div>

// 		<h4 style={titleStyle}>Many Items</h4>
// 		<div style={wrapperStyle}>
// 			<NavBar navItems={manyItems} />
// 		</div>
// 	</div>
// );

// storiesOf('Components', module)
// .add('NavBar - Dark', () => (
// 	<div>
// 		<AccentStyle {...accentDataDark} />
// 		{navBars}
// 	</div>
// ))
// .add('NavBar - Light', () => (
// 	<div>
// 		<AccentStyle {...accentDataLight} />
// 		{navBars}
// 	</div>
// ));
