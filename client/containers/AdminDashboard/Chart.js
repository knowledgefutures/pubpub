import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip, ComposedChart, Bar, Line, XAxis, YAxis } from 'recharts';

const propTypes = {
	title: PropTypes.string.isRequired,
	data: PropTypes.object.isRequired,
};

const Chart = function(props) {
	return (
		<div>
			<h2>{props.title}</h2>
			<ComposedChart width={730} height={250} data={props.data}>
				<XAxis dataKey="month" />
				<YAxis yAxisId="left" orientation="left" />
				<YAxis yAxisId="right" orientation="right" />
				<Tooltip />
				<Bar dataKey="prev" yAxisId="left" stackId="a" fill="green" />
				<Bar dataKey="current" yAxisId="left" stackId="a" fill="blue" />
				<Bar dataKey="active" yAxisId="left" stackId="b" fill="red" />
				<Line dataKey="growth" yAxisId="right" />
			</ComposedChart>
		</div>
	);
};

Chart.propTypes = propTypes;
export default Chart;
