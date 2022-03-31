import React, { useMemo } from 'react';
import Color from 'color';

type Props = {
	bannerText: String;
	accentColor: any;
	right?: React.ReactNode;
};

require('./banner.scss');

const Banner = (props: Props) => {
	const { bannerText, accentColor, right } = props;

	const lighterAccentColor = useMemo(() => Color(accentColor).alpha(0.1), [accentColor]);

	return (
		<div style={{ background: lighterAccentColor }} className="banner">
			<div className="banner-text">{bannerText}</div>
			<div>{right}</div>
		</div>
	);
};

export default Banner;
