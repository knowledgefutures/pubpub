import React from 'react';

require('./pubLoadingBars.scss');

const PubLoadingBars = function() {
	const getStyle = (width)=> {
		return {
			height: '25px',
			width: `${width}%`,
			marginBottom: '0.75em',
		};
	};

	return (
		<div className="pub-loading-bars-component">
			<p className="bp3-skeleton" style={getStyle(100)} />
			<p className="bp3-skeleton" style={getStyle(80)} />
			<p>Loading...</p>
			<p className="bp3-skeleton" style={getStyle(70)} />
			<p className="bp3-skeleton" style={getStyle(90)} />
		</div>
	);
};

export default PubLoadingBars;
