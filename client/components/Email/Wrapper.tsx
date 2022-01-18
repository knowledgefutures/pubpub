import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';

import { BaseTableStyle } from './shared';

type Props = {
	preview?: string;
	children: React.ReactNode;
	backgroundColor?: string;
};

const TableStyle = styled(BaseTableStyle).attrs({
	height: '100%',
	width: '100%',
})``;

const GlobalStyle = createGlobalStyle`
  .hidden-fix {
    display: none !important;
	}
`;

const EmailPreview = (props: { text: string }) => {
	const text = props.text + `&nbsp; &zwnj; `.repeat(150 - props.text.length);
	return (
		<div
			className="hidden-fix"
			style={{
				display: 'none',
				fontSize: '1px',
				lineHeight: '1px',
				maxHeight: '0px',
				maxWidth: '0px',
				opacity: 0,
				overflow: 'hidden',
			}}
			// eslint-disable-next-line react/no-danger
			dangerouslySetInnerHTML={{ __html: text }}
		/>
	);
};

export const Wrapper = ({ preview, children, backgroundColor = 'white' }: Props) => (
	<body
		style={{
			fontFamily: 'Helvetica, Arial, sans-serif',
			backgroundColor,
		}}
	>
		<GlobalStyle />
		{preview && <EmailPreview text={preview} />}
		<div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
			<TableStyle>
				<tbody>
					<tr>
						<td align="center" valign="top">
							{children}
						</td>
					</tr>
				</tbody>
			</TableStyle>
		</div>
	</body>
);
