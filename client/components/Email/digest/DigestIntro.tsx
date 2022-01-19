import React from 'react';
import styled from 'styled-components';
import Color from 'color';

import { Community } from 'types';
import { communityUrl } from 'utils/canonicalUrls';
import { formatDate } from 'utils/dates';
import { Icon } from 'client/components';

import { Section, Button } from '..';
import { BaseTableStyle } from '../shared';

type Props = {
	accentColorDark: string;
	community: Community;
	date: Date;
};

type StyleProps = {
	accentColorDark: string;
};

const TableStyle = styled(BaseTableStyle)<StyleProps>`
	border-top: 1px solid ${(props) => props.accentColorDark};
`;

const ButtonCellStyle = styled.td`
	vertical-align: middle;
	width: 39%;
`;

const TextCellStyle = styled.td`
	padding-right: 30px;
	font-size: 12px;
	line-height: 18px;
	font-weight: 400;
	text-align: justify;
	width: 61%;
`;

const SpanStyle = styled.span`
	fill: #333333;
	padding-right: 9px;
`;

export const DigestIntro = (props: Props) => {
	const { date } = props;
	const fadedBackgroundColor = Color(props.accentColorDark).fade(0.95).rgb().string();

	return (
		<TableStyle accentColorDark={props.accentColorDark}>
			<tr>
				<td>
					<Section backgroundColor={fadedBackgroundColor}>
						<BaseTableStyle>
							<tr>
								<TextCellStyle>
									This digest is a compilation of activity in the&nbsp;
									<a href={communityUrl(props.community)}>
										{props.community.title}
									</a>
									&nbsp;community for the day of&nbsp;
									{formatDate(date)}.
								</TextCellStyle>
								<ButtonCellStyle>
									<Button
										linkUrl={`${communityUrl(props.community)}/dash/activity`}
										width="100%"
									>
										<SpanStyle>
											<Icon icon="pulse" />
										</SpanStyle>
										<span>View latest activity</span>
									</Button>
								</ButtonCellStyle>
							</tr>
						</BaseTableStyle>
					</Section>
				</td>
			</tr>
		</TableStyle>
	);
};
