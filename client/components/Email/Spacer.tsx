import React from 'react';
import styled from 'styled-components';

import { BaseTableStyle } from './shared';

type Props = {
	children: React.ReactNode;
	height?: number;
};

const CellStyle = styled.td.attrs((props) => ({
	valign: 'top',
	height: props.height,
}))`
	font-size: ${(props) => props.height}px;
	line-height: ${(props) => props.height}px;
`;

export const Spacer = ({ children, height = 50 }: Props) => (
	<BaseTableStyle width="100%">
		<tr>
			<CellStyle height={height}>{children}</CellStyle>
		</tr>
	</BaseTableStyle>
);
