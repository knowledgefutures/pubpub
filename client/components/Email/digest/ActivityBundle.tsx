import React from 'react';
import styled from 'styled-components';

import { ActivityAssociations } from 'types';
import { Icon } from 'components';

import { ActivityBundleRow } from './ActivityBundleRow';
import { DedupedActivityItems } from './Digest';

const MAX_TITLE_CHARS = 65;

const truncate = (str: string) =>
	str.length > MAX_TITLE_CHARS ? str.substr(0, MAX_TITLE_CHARS - 1) + '…' : str;

type StyleProps = {
	accentColorDark?: string;
};

type Props = {
	isWithTitle?: boolean;
	accentColorDark: string;
	groupedItems: DedupedActivityItems;
	associations: ActivityAssociations;
	userId: string;
};

const H3Style = styled.h3`
	font-size: 14px;
	font-style: normal;
	font-weight: 700;
	line-height: 16px;
	text-align: left;
	letter-spacing: 0.01em;
	display: inline-block;
	a {
		text-decoration: none;
	}
`;

const ListItemStyle = styled.li`
	padding-top: 17px;
`;

const SpanStyle = styled.span<StyleProps>`
	fill: ${(props) => props.accentColorDark};
	padding-right: 9px;
`;

export const ActivityBundle = (props: Props) => {
	const {
		groupedItems: { icon, items, title, url },
	} = props;
	const truncatedTitle = truncate(title);
	return (
		<ListItemStyle>
			{props.isWithTitle && (
				<>
					<SpanStyle>
						<Icon iconSize={12} icon={icon} color={props.accentColorDark} />
					</SpanStyle>
					<H3Style>{url ? <a href={url}>{truncatedTitle}</a> : truncatedTitle}</H3Style>
				</>
			)}
			<ActivityBundleRow
				associations={props.associations}
				userId={props.userId}
				items={Object.values(items)}
			/>
		</ListItemStyle>
	);
};
