import React from 'react';
import styled from 'styled-components';

import { Icon, IconName } from 'components';

type StyleProps = {
	accentColorDark?: string;
};

type PropTypes = {
	accentColorDark: string;
	title: string;
	icon: IconName;
};

const DivStyle = styled.div<StyleProps>`
	border-bottom: 1px solid ${(props) => props.accentColorDark};
	padding-bottom: 15px;
`;

const SpanStyle = styled.span<StyleProps>`
	fill: ${(props) => props.accentColorDark};
	padding-right: 9px;
`;

const H2Style = styled.h2<StyleProps>`
	font-size: 16px;
	font-style: normal;
	font-weight: 400;
	line-height: 18px;
	text-align: left;
	letter-spacing: 0.01em;
	display: inline-block;
	color: ${(props) => props.accentColorDark};
`;

export const DigestSectionTitle = (props: PropTypes) => (
	<DivStyle accentColorDark={props.accentColorDark}>
		<SpanStyle>
			<Icon icon={props.icon} iconSize={12} color={props.accentColorDark} />
		</SpanStyle>
		<H2Style accentColorDark={props.accentColorDark}>{props.title}</H2Style>
	</DivStyle>
);
