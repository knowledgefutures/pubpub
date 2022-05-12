import React from 'react';

import { BylineProps } from 'components/Byline/Byline';
import { getAllPubContributors } from 'utils/contributors';
import { Pub } from 'types';
import WithinCommunityByline from '../WithinCommunityByline/WithinCommunityByline';

type OwnProps = {
	pubData: Pub;
	hideAuthors?: boolean;
	hideContributors?: boolean;
};

const defaultProps = {
	hideAuthors: false,
	hideContributors: true,
};

type OwnPubBylineProps = (OwnProps & typeof defaultProps) & Omit<BylineProps, 'contributors'>;

type Props = OwnPubBylineProps & typeof defaultProps;

const PubByline = (props: Props) => {
	const { pubData, hideAuthors = false, hideContributors = false } = props;
	const authors = getAllPubContributors(pubData, 'contributors', hideAuthors, hideContributors);
	return <WithinCommunityByline {...props} contributors={authors} />;
};
PubByline.defaultProps = defaultProps;
export default PubByline;
