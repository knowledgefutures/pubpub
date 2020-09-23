import React from 'react';

import Byline, { BylineProps } from 'components/Byline/Byline';
import { getAllPubContributors } from 'utils/pub/contributors';

type Props = {
	pubData: {};
	hideAuthors?: boolean;
	hideContributors?: boolean;
} & Omit<BylineProps, 'contributors'>;

const defaultProps = {
	hideAuthors: false,
	hideContributors: true,
};

const PubByline = (props: Props) => {
	const { pubData, hideAuthors = false, hideContributors = false } = props;
	const authors = getAllPubContributors(pubData, hideAuthors, hideContributors);
	return <Byline {...props} contributors={authors} />;
};
PubByline.defaultProps = defaultProps;
export default PubByline;
