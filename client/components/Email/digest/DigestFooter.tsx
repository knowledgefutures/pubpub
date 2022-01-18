import React from 'react';
import styled from 'styled-components';

import { communityUrl } from 'utils/canonicalUrls';
import { getDashUrl } from 'utils/dashboard';
import { Community } from 'types';

type Props = {
	community: Community;
};

const ParagraphStyle = styled.p`
	font-family: Arial;
	font-size: 10px;
	font-style: normal;
	font-weight: 400;
	line-height: 15px;
	letter-spacing: 0em;
	text-align: center;
	padding: 30px 0 0;
	color: #bdbdbd;
`;

export const DigestFooter = (props: Props) => {
	const activityDashUrl = `${communityUrl(props.community)}${getDashUrl({ mode: 'activity' })}`;
	return (
		<ParagraphStyle>
			You are receiving this email because you signed up for the weekly Activity Digest for
			this PubPub Community. <br />
			You can <a href={activityDashUrl}>manage your Digest Settings</a>.
		</ParagraphStyle>
	);
};
