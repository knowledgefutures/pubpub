import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tab, Tabs } from '@blueprintjs/core';

import { formatDate } from 'utils/dates';

require('./assignDoiPreview.scss');

const propTypes = {
	depositJson: PropTypes.object.isRequired,
	depositXml: PropTypes.string.isRequired,
};
const defaultProps = {};

const isBook = (doiBatch) => 'book' in doiBatch.body;
const isJournal = (doiBatch) => 'journal' in doiBatch.body;
const isConference = (doiBatch) => 'conference' in doiBatch.body;

const renderRelations = (relatedItems) => {
	return (
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

const renderPublicationDate = (publication_date) => {
	const { day, month, year } = publication_date;

	return (
		<>
			<dt>Publication Date</dt>
			<dd>{formatDate(new Date([month, day, year]))}</dd>
		</>
	);
};

const renderContributors = (contributors) => {
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

const renderArticlePreview = (doi_batch) => {
	const {
		body: {
			journal: {
				journal_article: {
					titles,
					publication_date,
					contributors,
					'rel:program': { related_item: relatedItems },
				},
				journal_metadata: {
					full_title: journalFullTitle,
					doi_data: { doi: journalDoi },
				},
			},
		},
	} = doi_batch;

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
			<h6>Relationships</h6>
			{relProgram && renderRelations(relatedItems)}
		</>
	);
};

const renderBookPreview = (doi_batch) => {
	const {
		body: {
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
					'rel:program': { related_item: relatedItems },
				},
			},
		},
	} = doi_batch;

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
			<h6>Relationships</h6>
			{relProgram && renderRelations(relatedItems)}
		</>
	);
};

const renderConferencePreview = (doi_batch) => {
	const {
		body: {
			conference: {
				conference_paper: {
					contributors,
					titles: paperTitles,
					'rel:program': { related_item: relatedItems },
				},
				event_metadata: {
					conference_name,
					conference_date: { '#text': conferenceDate },
				},
				proceedings_metadata: { proceedings_title, publication_date, publisher },
			},
		},
	} = doi_batch;

	return (
		<>
			<h6>Conference Paper</h6>
			<dl>
				{renderTitles(paperTitles)}
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
			<h6>Relationships</h6>
			{relProgram && renderRelations(relatedItems)}
		</>
	);
};

function AssignDoiPreview(props) {
	const [selectedTab, setSelectedTab] = useState('preview');
	const {
		deposit: { doi_batch },
		dois: { community: communityDoi, pub: pubDoi },
	} = props.depositJson;

	const renderPreviewTab = () => {
		return (
			<>
				<h6>DOIs</h6>
				<dl>
					<dt>Community</dt>
					<dd>{communityDoi}</dd>
					<dt>Pub</dt>
					<dd>{pubDoi}</dd>
				</dl>
				{isJournal(doi_batch) && renderArticlePreview(doi_batch)}
				{isBook(doi_batch) && renderBookPreview(doi_batch)}
				{isConference(doi_batch) && renderConferencePreview(doi_batch)}
			</>
		);
	};

	return (
		<Tabs
			onChange={setSelectedTab}
			selectedTabId={selectedTab}
			className="assign-doi-preview-component"
		>
			<Tab id="preview" title="Preview" panel={renderPreviewTab()} />
			<Tab id="xml" title="XML" panel={<pre>{props.depositXml}</pre>} />
		</Tabs>
	);
}

AssignDoiPreview.propTypes = propTypes;
AssignDoiPreview.defaultProps = defaultProps;

export default AssignDoiPreview;
