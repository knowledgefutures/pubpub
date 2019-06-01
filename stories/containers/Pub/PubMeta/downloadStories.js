import React from 'react';
import { storiesOf } from '@storybook/react';
import Download from 'containers/Pub/PubMeta/Download';
import { pubData } from 'data';

require('containers/Pub/PubMeta/pubMeta.scss');

const pubDataWithFormattedDownload = {
	...pubData,
	downloads: [{ type: 'formatted', createdAt: '2019-03-01T21:47:48.592Z', url: 'test.pdf' }],
};

storiesOf('containers/Pub/PubMeta/Download', module)
	.add('default', () => (
		<div className="pub-manage-component" style={{ margin: '20px' }}>
			<Download pubData={pubData} />
		</div>
	))
	.add('with-formatted-download', () => (
		<div className="pub-manage-component" style={{ margin: '20px' }}>
			<Download pubData={pubDataWithFormattedDownload} />
		</div>
	))
	.add('add-formatted-download', () => (
		<div className="pub-manage-component" style={{ margin: '20px' }}>
			<Download pubData={{ ...pubData, canManage: true }} />
		</div>
	))
	.add('update-formatted-download', () => (
		<div className="pub-manage-component" style={{ margin: '20px' }}>
			<Download pubData={{ ...pubDataWithFormattedDownload, canManage: true }} />
		</div>
	));
