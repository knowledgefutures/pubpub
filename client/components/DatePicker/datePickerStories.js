import React, { useState } from 'react';
import { storiesOf } from '@storybook/react';

import { formatDate } from 'utils/dates';

import DatePicker from './DatePicker';

// eslint-disable-next-line react/prop-types
const StatefulDatePicker = ({ initialDate }) => {
	const [date, setDate] = useState(initialDate);
	return (
		<div>
			<DatePicker date={date} onSelectDate={setDate} />
			<div>
				Selected date: {date ? formatDate(new Date(date), { inUtcTime: true }) : 'none'}
			</div>
		</div>
	);
};

storiesOf('components/DatePicker', module).add('default', () => {
	return (
		<div style={{ margin: '1em' }}>
			<h4>With Date object</h4>
			<p>
				<StatefulDatePicker initialDate={new Date('2019-03-05')} />
			</p>
			<h4>With date string</h4>
			<p>
				<StatefulDatePicker initialDate="2015-11-02" />
			</p>
			<h4>Empty</h4>
			<p>
				<StatefulDatePicker initialDate={null} />
			</p>
		</div>
	);
});
