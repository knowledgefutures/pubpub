import React from 'react';
import styled from 'styled-components';

import { BaseTableStyle } from './shared';

type StyleProps = {
	color?: string;
	width?: string;
	backgroundColor?: string;
};

type Props = StyleProps & {
	children: React.ReactNode;
	linkUrl?: string;
};

const TableStyle = styled(BaseTableStyle).attrs({
	align: 'center',
})<StyleProps>`
	background-color: ${(props) => props.backgroundColor};
	text-align: center;
	width: ${(props) => props.width}px;
`;

const RowStyle = styled.tr``;

const CellStyle = styled.td.attrs({
	align: 'center',
	valign: 'middle',
})`
	height: 40px;
	text-align: center;
`;

const ButtonStyle = styled.a<StyleProps>`
	border: 1px solid ${(props) => props.color};
	border-radius: 5px;
	color: ${(props) => props.color || 'inherit'};
	display: inline-block;
	font-family: Arial;
	font-size: 14px;
	font-style: normal;
	font-weight: 400;
	line-height: 16px;
	letter-spacing: 0.01em;
	text-align: center;
	mso-hide: all;
	padding: 12px 18px;
	text-decoration: none;
	-webkit-text-size-adjust: none;
	width: ${(props) => props.width}px;
`;

export const Button = ({
	children,
	linkUrl = '#',
	width = '200',
	color,
	backgroundColor = 'transparent',
}: Props) => (
	<TableStyle width={width} backgroundColor={backgroundColor}>
		<RowStyle>
			<CellStyle>
				<div>
					<ButtonStyle href={linkUrl} color={color} width={width}>
						<span>{children}</span>
					</ButtonStyle>
				</div>
			</CellStyle>
		</RowStyle>
	</TableStyle>
);
