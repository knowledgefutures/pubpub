import React from 'react';
import IframeResizer from 'iframe-resizer-react';

require('./adminDashboard.scss');

type Props = {
	impactData: any;
};

const AdminDashboard = (props: Props) => {
	const { impactData } = props;
	const { baseToken } = impactData;
	const dashUrl = `https://metabase.pubpub.org/embed/dashboard/${baseToken}#bordered=false&titled=false`;
	const getOffset = (width) => {
		return width < 960 ? 45 : 61;
	};
	return (
		<div className="dashboard-impact-container admin-dashboard">
			<section>
				<h3>PubPub Top Analytics</h3>
			</section>
			<section>
				(
				<IframeResizer
					className="metabase main"
					src={dashUrl}
					title="Analytics"
					frameBorder="0"
					onResized={({ iframe, height, width }) => {
						/* eslint-disable-next-line no-param-reassign */
						iframe.style.height = `${height - getOffset(width)}px`;
					}}
				/>
				)
			</section>
		</div>
	);
};

export default AdminDashboard;
