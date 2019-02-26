import React from 'react';
import { storiesOf } from '@storybook/react';
import PubPreview from 'components/PubPreview/PubPreview';
import { collectionData, pubData } from '../data';

storiesOf('Components/PubPreview', module).add('default', () => (
	<div className="container">
		<h1 style={{ margin: '0em 0em 0.5em' }}>Large</h1>
		<div className="row">
			<div className="col-12">
				<PubPreview
					pubData={pubData}
					title={collectionData.pubs[0].title}
					description={collectionData.pubs[0].description}
					slug={collectionData.pubs[0].slug}
					bannerImage={collectionData.pubs[0].avatar}
					size="large"
					publicationDate={collectionData.pubs[0].firstPublishedAt}
					collaborators={collectionData.pubs[0].collaborators}
					authors={collectionData.pubs[0].collaborators.filter((item) => {
						return item.Collaborator.isAuthor;
					})}
				/>
			</div>
		</div>
		<h1 style={{ margin: '2em 0em 0.5em' }}>Medium</h1>
		<div className="row">
			<div className="col-6">
				<PubPreview
					pubData={pubData}
					title={collectionData.pubs[1].title}
					description={collectionData.pubs[1].description}
					slug={collectionData.pubs[1].slug}
					bannerImage={collectionData.pubs[1].avatar}
					size="medium"
					publicationDate={collectionData.pubs[1].firstPublishedAt}
					collaborators={collectionData.pubs[1].collaborators}
					authors={collectionData.pubs[1].collaborators.filter((item) => {
						return item.Collaborator.isAuthor;
					})}
				/>
			</div>
			<div className="col-6">
				<PubPreview
					pubData={pubData}
					title={collectionData.pubs[2].title}
					description={collectionData.pubs[2].description}
					slug={collectionData.pubs[2].slug}
					bannerImage={collectionData.pubs[2].avatar}
					size="medium"
					publicationDate={collectionData.pubs[2].firstPublishedAt}
					collaborators={collectionData.pubs[2].collaborators}
					authors={collectionData.pubs[2].collaborators.filter((item) => {
						return item.Collaborator.isAuthor;
					})}
				/>
			</div>
			<div className="col-6">
				<PubPreview
					pubData={pubData}
					title={collectionData.pubs[1].title}
					description={collectionData.pubs[1].description}
					slug={collectionData.pubs[1].slug}
					bannerImage={collectionData.pubs[1].avatar}
					size="medium"
					publicationDate={collectionData.pubs[1].firstPublishedAt}
					collaborators={collectionData.pubs[1].collaborators}
					authors={collectionData.pubs[1].collaborators.filter((item) => {
						return item.Collaborator.isAuthor;
					})}
					communityData={{
						accentColor: '#000000',
						domain: 'jods.mitpress.mit.edu',
						id: 'fake-id',
						headerLogo: 'https://assets.pubpub.org/b5ftxm4v/51508255582371.png',
						subdomain: 'jods',
						title: 'Journal of Design and Science',
					}}
				/>
			</div>
		</div>

		<h1 style={{ margin: '2em 0em 0.5em' }}>Small</h1>
		<div className="row">
			<div className="col-12">
				<PubPreview
					pubData={pubData}
					title={collectionData.pubs[0].title}
					description={collectionData.pubs[0].description}
					slug={collectionData.pubs[0].slug}
					bannerImage={collectionData.pubs[0].avatar}
					size="small"
					publicationDate={collectionData.pubs[0].firstPublishedAt}
					collaborators={collectionData.pubs[0].collaborators}
					authors={collectionData.pubs[0].collaborators.filter((item) => {
						return item.Collaborator.isAuthor;
					})}
				/>
			</div>
			<div className="col-12">
				<PubPreview
					pubData={pubData}
					title={collectionData.pubs[1].title}
					description={collectionData.pubs[1].description}
					slug={collectionData.pubs[1].slug}
					bannerImage={collectionData.pubs[1].avatar}
					size="small"
					publicationDate={collectionData.pubs[1].firstPublishedAt}
					collaborators={collectionData.pubs[1].collaborators}
					authors={collectionData.pubs[1].collaborators.filter((item) => {
						return item.Collaborator.isAuthor;
					})}
				/>
			</div>
		</div>

		<h1 style={{ margin: '2em 0em 0.5em' }}>Placeholder</h1>
		<div className="row">
			<div className="col-12">
				<PubPreview pubData={pubData} size="large" isPlaceholder={true} />
			</div>
		</div>
		<div className="row">
			<div className="col-6">
				<PubPreview
					pubData={pubData}
					title="A sample title for placeholder"
					size="medium"
					isPlaceholder={true}
				/>
			</div>
			<div className="col-6">
				<PubPreview
					pubData={pubData}
					title="A sample title for placeholder"
					size="medium"
					isPlaceholder={true}
					inputContent={<input className="bp3-input bp3-fill" type="text" />}
				/>
			</div>
		</div>
		<div className="row">
			<div className="col-12">
				<PubPreview pubData={pubData} size="small" isPlaceholder={true} />
			</div>
		</div>

		<h1 style={{ margin: '0em 0em 0.5em' }}>Placeholder Backgrounds</h1>
		<div className="row">
			<div className="col-6">
				<PubPreview
					pubData={pubData}
					title="a"
					description={collectionData.pubs[0].description}
					slug={collectionData.pubs[0].slug}
					size="medium"
					publicationDate={collectionData.pubs[0].firstPublishedAt}
					collaborators={collectionData.pubs[0].collaborators}
					authors={collectionData.pubs[0].collaborators.filter((item) => {
						return item.Collaborator.isAuthor;
					})}
				/>
			</div>
			<div className="col-6">
				<PubPreview
					pubData={pubData}
					title="b"
					description={collectionData.pubs[0].description}
					slug={collectionData.pubs[0].slug}
					size="medium"
					publicationDate={collectionData.pubs[0].firstPublishedAt}
					collaborators={collectionData.pubs[0].collaborators}
					authors={collectionData.pubs[0].collaborators.filter((item) => {
						return item.Collaborator.isAuthor;
					})}
				/>
			</div>
			<div className="col-6">
				<PubPreview
					pubData={pubData}
					title="c"
					description={collectionData.pubs[0].description}
					slug={collectionData.pubs[0].slug}
					size="medium"
					publicationDate={collectionData.pubs[0].firstPublishedAt}
					collaborators={collectionData.pubs[0].collaborators}
					authors={collectionData.pubs[0].collaborators.filter((item) => {
						return item.Collaborator.isAuthor;
					})}
				/>
			</div>
			<div className="col-6">
				<PubPreview
					pubData={pubData}
					title="d"
					description={collectionData.pubs[0].description}
					slug={collectionData.pubs[0].slug}
					size="medium"
					publicationDate={collectionData.pubs[0].firstPublishedAt}
					collaborators={collectionData.pubs[0].collaborators}
					authors={collectionData.pubs[0].collaborators.filter((item) => {
						return item.Collaborator.isAuthor;
					})}
				/>
			</div>
			<div className="col-6">
				<PubPreview
					pubData={pubData}
					title="e"
					description={collectionData.pubs[0].description}
					slug={collectionData.pubs[0].slug}
					size="medium"
					publicationDate={collectionData.pubs[0].firstPublishedAt}
					collaborators={collectionData.pubs[0].collaborators}
					authors={collectionData.pubs[0].collaborators.filter((item) => {
						return item.Collaborator.isAuthor;
					})}
				/>
			</div>
		</div>
	</div>
));
