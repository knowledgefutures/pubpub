/**
 * This component picks dates in UTC time, e.g.: March 10, 2018 is `Fri Mar 10 2018 00:00:00 GMT+0`.
 * This means that without special handling, the dates it provides may render unexpectedly in
 * certain timezones, very possibly the one in which you are reading this code! It is the caller's
 * responsibility to handle these dates correctly, perhaps by using the inUtcTime option of
 * formatDate(), or the getLocalDateMatchingUtcCalendarDate() utility.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { InputGroup } from '@blueprintjs/core';
import dateFormat from 'dateformat';

type Props = {
	onSelectDate: (...args: any[]) => any;
	date: string | any;
};

const isValidDate = (date) => !Number.isNaN(date.valueOf());

const getDateFromEvent = (evt) => {
	const { value } = evt.target;
	if (value) {
		const [year, month, day] = value.split('-');
		if (year && year.length === 4 && !year.startsWith('0') && month && day) {
			const date = new Date(value);
			if (isValidDate(date)) {
				return date;
			}
		}
		throw new Error();
	}
	return null;
};

const getInputValueFromDateProp = (dateProp) => {
	if (dateProp) {
		const date = new Date(dateProp);
		if (isValidDate(date)) {
			return dateFormat(date, 'UTC:yyyy-mm-dd');
		}
		throw new Error();
	}
	return dateProp;
};

const getEarlyRenderableProps = (dateProp, hasMounted) => {
	if (!hasMounted) {
		try {
			const value = getInputValueFromDateProp(dateProp);
			return { value: value };
		} catch (_) {
			return {};
		}
	}
	return {};
};

const DatePicker = (props: Props) => {
	const { date: dateProp, onSelectDate, ...restProps } = props;
	const inputRef = useRef();
	const [hasMounted, setHasMounted] = useState(false);

	useEffect(() => setHasMounted(true), []);

	useEffect(() => {
		const { current: input } = inputRef;
		if (input) {
			try {
				const value = getInputValueFromDateProp(dateProp);
				// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
				input.value = value;
			} catch (_) {
				// Don't do anything with an invalid date
			}
		}
	}, [dateProp]);

	const handleInput = useCallback(
		(evt) => {
			try {
				const nextDate = getDateFromEvent(evt);
				onSelectDate(nextDate);
			} catch (_) {
				// Don't do anything with an invalid date
			}
		},
		[onSelectDate],
	);

	return (
		<InputGroup
			placeholder="YYYY-MM-DD"
			{...restProps}
			{...getEarlyRenderableProps(dateProp, hasMounted)}
			type="date"
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'MutableRefObject<undefined>' is not assignab... Remove this comment to see the full error message
			inputRef={inputRef}
			onInput={handleInput}
		/>
	);
};
export default DatePicker;
