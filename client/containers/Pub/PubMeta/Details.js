import React, { useRef, useState } from 'react';
import dateFormat from 'dateformat';
import { Button } from '@blueprintjs/core';

import { pubDataProps } from 'types/pub';
import ensureUserForAttribution from 'shared/utils/ensureUserForAttribution';
import { getPubPublishedDate } from 'shared/utils/pubDates';
import { doiUrl } from 'shared/utils/canonicalUrls';
import ClickToCopyButton from 'components/ClickToCopyButton/ClickToCopyButton';

import CitationsModal from './CitationsModal';

require('./details.scss');

const formatDate = (date) => dateFormat(date, 'mmm dd, yyyy');

const propTypes = {
	pubData: pubDataProps.isRequired,
};

const Details = (props) => {
	const { pubData } = props;
	const [isCitationModalOpen, setCitationModalOpen] = useState(false);
	const copyableCitationRef = useRef();

	const publishedDate = getPubPublishedDate(pubData, pubData.activeBranch);

	return (
		<div className="pub-meta-details">
			<div className="column">
				<div className="details-field">
					<h4>Authors & attribution</h4>
					<ol className="details-attribution">
						{pubData.attributions.map((attr) => {
							const attrWithUser = ensureUserForAttribution(attr);
							const { firstName, lastName } = attrWithUser.user;
							const fullName = `${firstName} ${lastName}`;
							return (
								<li>
									<div className="inner">
										<div className="name">{fullName}</div>
										{attr.affiliation && (
											<div className="affiliation">{attr.affiliation}</div>
										)}
									</div>
								</li>
							);
						})}
					</ol>
				</div>
			</div>
			<div className="column">
				{pubData.doi && (
					<div className="details-field">
						<h4>DOI</h4>
						<a href={doiUrl(pubData.doi)}>{pubData.doi}</a>
					</div>
				)}
				{pubData.citationData && (
					<div className="details-field details-citation">
						<h4>Cite as</h4>
						<div
							ref={copyableCitationRef}
							dangerouslySetInnerHTML={{ __html: pubData.citationData.pub.apa }}
						/>
						<div className="button-row">
							<ClickToCopyButton
								className="copy-button"
								icon="duplicate"
								copyString={() => {
									if (copyableCitationRef.current) {
										return copyableCitationRef.current.textContent;
									}
									return '';
								}}
							>
								Copy
							</ClickToCopyButton>
							<Button icon="more" minimal onClick={() => setCitationModalOpen(true)}>
								More
							</Button>
							<CitationsModal
								isOpen={isCitationModalOpen}
								citationData={pubData.citationData}
								onClose={() => setCitationModalOpen(false)}
							/>
						</div>
					</div>
				)}
			</div>
			<div className="column">
				<div className="details-field">
					<h4>First updated</h4>
					{formatDate(pubData.activeBranch.createdAt)}
				</div>
				<div className="details-field">
					<h4>Last updated</h4>
					{formatDate(pubData.activeBranch.updatedAt)}
				</div>
				{publishedDate && (
					<div className="details-field">
						<h4>Published</h4>
						{formatDate(publishedDate)}
					</div>
				)}
			</div>
		</div>
	);
};

Details.propTypes = propTypes;
export default Details;
