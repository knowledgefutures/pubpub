import React, { useState } from 'react';
import { Tab, Tabs } from '@blueprintjs/core';

import { formatDate } from 'utils/dates';
import {
	getDepositBody,
	getDepositRecordContentVersion,
	isPreprintDeposit,
	isBookDeposit,
	isJournalDeposit,
	isConferenceDeposit,
	isPeerReviewDeposit,
	isStandaloneComponentDeposit,
} from 'utils/crossref/parseDeposit';

require('./assignDoiPreview.scss');

type OwnProps = {
	crossrefDepositRecord: any;
};
const defaultProps = {};

const renderRelationships = (program) => {
	if (!program) {
		return null;
	}

	const { 'rel:related_item': relatedItems } = program;

	if (relatedItems.length === 0) {
		return null;
	}

	return (
		<>
			<h6>Relationships</h6>
			<dl>
				{relatedItems.map(
					({
						'rel:inter_work_relation': interWorkRelation,
						'rel:intra_work_relation': intraWorkRelation,
					}) => {
						const { '#text': identifier, '@relationship-type': relationshipType } =
							interWorkRelation || intraWorkRelation;

						return (
							<React.Fragment key={identifier}>
								<dt>Relationship Type</dt>
								<dd>{relationshipType}</dd>
								<dt>Identifier</dt>
								<dd>{identifier}</dd>
							</React.Fragment>
						);
					},
				)}
			</dl>
		</>
	);
};

const renderTitles = (titles) => {
	return (
		<>
			<dt>Title</dt>
			<dd>{titles.title}</dd>
		</>
	);
};

const renderPublisher = (publisher) => {
	return (
		<>
			<dt>Publisher</dt>
			<dd>{publisher.publisher_name}</dd>
		</>
	);
};

const renderPublicationDate = (publication_date, title = 'Publication Date') => {
	const { day, month, year } = publication_date;

	return (
		<>
			<dt>{title}</dt>
			<dd>{formatDate(`${year}-${month}-${day}`, { inUtcTime: true })}</dd>
		</>
	);
};

const renderContributors = (contributors) => {
	if (!contributors) {
		return null;
	}

	const contributorNames = contributors.person_name.map(
		(contributor) =>
			`${contributor.given_name} ${contributor.surname} (${contributor['@contributor_role']})`,
	);

	return (
		<>
			<dt>Contributors</dt>
			<dd>
				<ul>{contributorNames}</ul>
			</dd>
		</>
	);
};

const renderJournalIssue = (journal_issue) => {
	const { titles, publication_date } = journal_issue;

	return (
		<>
			<h6>Journal Issue</h6>
			<dl>
				{renderTitles(titles)}
				{renderPublicationDate(publication_date)}
			</dl>
		</>
	);
};

const renderArticlePreview = (body) => {
	const {
		journal: {
			journal_article: {
				titles,
				publication_date,
				contributors,
				'rel:program': relationships,
			},
			journal_metadata: {
				full_title: journalFullTitle,
				doi_data: { doi: journalDoi },
			},
			journal_issue,
		},
	} = body;

	return (
		<>
			<h6>Journal Article</h6>
			<dl>
				{renderTitles(titles)}
				{renderPublicationDate(publication_date)}
				{renderContributors(contributors)}
			</dl>
			<h6>Journal Metadata</h6>
			<dl>
				<dt>Title</dt>
				<dd>{journalFullTitle}</dd>
				<dt>DOI</dt>
				<dd>{journalDoi}</dd>
			</dl>
			{journal_issue && renderJournalIssue(journal_issue)}
			{renderRelationships(relationships)}
		</>
	);
};

const renderBookPreview = (body) => {
	const {
		book: {
			book_metadata: {
				titles: bookTitles,
				edition_number,
				publisher,
				publication_date: bookPublicationDate,
			},
			content_item: {
				titles: contentTitles,
				contributors,
				publication_date: contentPublicationDate,
				'rel:program': relationships,
			},
		},
	} = body;

	return (
		<>
			<h6>Book Metadata</h6>
			<dl>
				{renderTitles(bookTitles)}
				<dt>Edition Number</dt>
				<dd>{edition_number}</dd>
				{renderPublisher(publisher)}
				{renderPublicationDate(bookPublicationDate)}
			</dl>
			<h6>Content</h6>
			<dl>
				{renderTitles(contentTitles)}
				{renderContributors(contributors)}
				{renderPublicationDate(contentPublicationDate)}
			</dl>
			{renderRelationships(relationships)}
		</>
	);
};

const renderConferencePreview = (body) => {
	const {
		conference: {
			conference_paper: { contributors, titles, 'rel:program': relationships },
			event_metadata: {
				conference_name,
				conference_date: { '#text': conferenceDate },
			},
			proceedings_metadata: { proceedings_title, publication_date, publisher },
		},
	} = body;

	return (
		<>
			<h6>Conference Paper</h6>
			<dl>
				{renderTitles(titles)}
				{renderContributors(contributors)}
			</dl>
			<h6>Event Metadata</h6>
			<dl>
				<dt>Conference Name</dt>
				<dd>{conference_name}</dd>
				<dt>Conference Date</dt>
				<dd>{formatDate(new Date(conferenceDate))}</dd>
			</dl>
			<h6>Proceedings Metadata</h6>
			<dl>
				<dt>Proceedings Title</dt>
				<dd>{proceedings_title}</dd>
				{renderPublicationDate(publication_date)}
				{renderPublisher(publisher)}
			</dl>
			{renderRelationships(relationships)}
		</>
	);
};

const renderPreprintPreview = (body) => {
	const {
		posted_content: { contributors, titles, 'rel:program': relationships, posted_date },
	} = body;

	return (
		<>
			<h6>Preprint</h6>
			<dl>
				{renderTitles(titles)}
				{renderContributors(contributors)}
				{renderPublicationDate(posted_date, 'Posted Date')}
			</dl>
			{renderRelationships(relationships)}
		</>
	);
};

const renderPeerReviewPreview = (body) => {
	const {
		peer_review: {
			'@type': type,
			'@recommendation': recommendation,
			contributors,
			titles,
			'rel:program': relationships,
			review_date,
		},
	} = body;

	return (
		<>
			<h6>Peer Review</h6>
			<dl>
				{renderTitles(titles)}
				{renderContributors(contributors)}
				{renderPublicationDate(review_date, 'Review Date')}
				{type && (
					<>
						<dt>Review Type</dt>
						<dd>{type}</dd>
					</>
				)}
				{recommendation && (
					<>
						<dt>Review Recommendation</dt>
						<dd>{recommendation}</dd>
					</>
				)}
			</dl>
			{renderRelationships(relationships)}
		</>
	);
};

const renderSupplementPreview = (body) => {
	const {
		sa_component: {
			'@parent_doi': parentDoi,
			component_list: {
				component: { contributors, titles, publication_date },
			},
		},
	} = body;

	return (
		<>
			<h6>Standalone Component</h6>
			<dl>
				<dt>Parent DOI</dt>
				<dd>{parentDoi}</dd>
				<dt>Parent Relation</dt>
				<dd>isPartOf</dd>
				{renderTitles(titles)}
				{renderContributors(contributors)}
				{renderPublicationDate(publication_date)}
			</dl>
		</>
	);
};

type Props = OwnProps & typeof defaultProps;

function AssignDoiPreview(props: Props) {
	const [selectedTab, setSelectedTab] = useState('preview');
	const { crossrefDepositRecord } = props;
	const body = getDepositBody(crossrefDepositRecord);
	const {
		doi,
		depositJson: {
			dois: { community: communityDoi, pub: pubDoi },
		},
		depositXml,
	} = crossrefDepositRecord;
	const contentVersion = getDepositRecordContentVersion(crossrefDepositRecord);

	const renderPreviewTab = () => {
		return (
			<>
				<h6>DOIs</h6>
				<dl>
					<dt>Community</dt>
					<dd>{communityDoi}</dd>
					<dt>Pub</dt>
					<dd>{doi || pubDoi}</dd>
					{contentVersion && contentVersion !== 'none' && (
						<>
							<dt>Content Version</dt>
							<dd>{contentVersion}</dd>
						</>
					)}
				</dl>
				{isJournalDeposit(crossrefDepositRecord) && renderArticlePreview(body)}
				{isBookDeposit(crossrefDepositRecord) && renderBookPreview(body)}
				{isConferenceDeposit(crossrefDepositRecord) && renderConferencePreview(body)}
				{isPreprintDeposit(crossrefDepositRecord) && renderPreprintPreview(body)}
				{isPeerReviewDeposit(crossrefDepositRecord) && renderPeerReviewPreview(body)}
				{isStandaloneComponentDeposit(crossrefDepositRecord) &&
					renderSupplementPreview(body)}
			</>
		);
	};

	return (
		<Tabs
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'number' is not assignable to type 'SetStateA... Remove this comment to see the full error message
			onChange={setSelectedTab}
			selectedTabId={selectedTab}
			className="assign-doi-preview-component"
		>
			<Tab id="preview" title="Preview" panel={renderPreviewTab()} />
			<Tab id="xml" title="XML" panel={<pre>{depositXml}</pre>} />
		</Tabs>
	);
}
AssignDoiPreview.defaultProps = defaultProps;

export default AssignDoiPreview;
