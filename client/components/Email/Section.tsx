import React from 'react';
import styled from 'styled-components';

import { BaseTableStyle } from './shared';

type StyleProps = {
	fontFamily?: string;
	alignment?: string;
	fontSize?: number;
	width?: number;
	backgroundColor?: string;
	logo?: string;
};

type Props = StyleProps & {
	children: React.ReactNode;
	color?: string;
	innerPadding?: string;
};

const TableStyle = styled(BaseTableStyle)<StyleProps>`
	${({ logo }) => logo && `background: url("${logo}") no-repeat right 40px center;`}
	background-color: ${(props) => props.backgroundColor};
	font-size: ${(props) => props.fontSize}px;
	text-align: ${(props) => props.alignment};
	max-width: ${(props) => props.width}px;
	width: 100%;
`;

export const Section = ({
	children,
	alignment = 'center',
	fontSize = 18,
	fontFamily = 'roboto,helvetica neue,helvetica,arial,sans-serif',
	backgroundColor = '#FFFFFF',
	logo,
	color = '#333333',
	innerPadding = '40px',
	width = 640,
}: Props) => (
	<TableStyle
		fontSize={fontSize}
		fontFamily={fontFamily}
		backgroundColor={backgroundColor}
		logo={logo}
		alignment={alignment}
		width={width}
	>
		<tr>
			<td valign="top" style={{ padding: innerPadding, color }}>
				{children}
			</td>
		</tr>
	</TableStyle>
);
