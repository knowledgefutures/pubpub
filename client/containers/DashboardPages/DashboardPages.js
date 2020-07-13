import React, { useState } from 'react';
import dateFormat from 'dateformat';
import { AnchorButton, Button } from '@blueprintjs/core';

import { usePageContext } from 'utils/hooks';
import { DashboardFrame, DashboardRowListing, DashboardRow, Icon } from 'components';

import CreatePageDialog from './CreatePageDialog';

require('./dashboardPages.scss');

const propTypes = {};

const sortPages = (pages) => pages.sort((a, b) => (a.title > b.title ? 1 : -1));

const DashboardPages = () => {
	const { locationData, communityData } = usePageContext();
	const [isCreatingPage, setCreatingPage] = useState(false);

	const renderControls = () => {
		return (
			<React.Fragment>
				<Button icon="plus" onClick={() => setCreatingPage(true)} outlined>
					Create Page
				</Button>
				<CreatePageDialog
					onClose={() => setCreatingPage(false)}
					isOpen={isCreatingPage}
					communityData={communityData}
					hostname={locationData.hostname}
				/>
			</React.Fragment>
		);
	};

	const renderPageItem = (page) => {
		const createdAtString = dateFormat(page.createdAt, 'mmm dd, yyyy');
		const rightSide = (
			<React.Fragment>
				<AnchorButton
					icon={<Icon icon="edit2" />}
					outlined
					href={`/dash/pages/${page.slug || 'home'}`}
				>
					Edit page
				</AnchorButton>
				<AnchorButton icon="share" outlined href={`/${page.slug}`}>
					Visit page
				</AnchorButton>
				<div className="privacy-indicator">
					<Icon icon={page.isPublic ? 'globe' : 'lock'} iconSize={14} />
					{page.isPublic ? 'Public' : 'Private'}
				</div>
			</React.Fragment>
		);
		return (
			<DashboardRow
				key={page.id}
				icon="page-layout"
				className="page-row"
				title={page.title}
				subtitle={`Created on ${createdAtString}`}
				rightSideElements={rightSide}
			/>
		);
	};

	return (
		<DashboardFrame
			className="dashboard-pages-container"
			title="Pages"
			details="Create and manage Pages to give stucture to your Community."
			controls={renderControls()}
		>
			<DashboardRowListing>
				{sortPages(communityData.pages).map(renderPageItem)}
			</DashboardRowListing>
		</DashboardFrame>
	);
};

DashboardPages.propTypes = propTypes;
export default DashboardPages;
