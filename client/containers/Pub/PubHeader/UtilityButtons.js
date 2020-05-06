import React from 'react';
import PropTypes from 'prop-types';

import { usePageContext } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';
import { DialogLauncher, PubThemePicker, PubShareDialog } from 'components';

import CitationsPreview from './CitationsPreview';
import Download from './Download';
import PopoverButton from './PopoverButton';
import PubToc from './PubToc';
import SmallHeaderButton from './SmallHeaderButton';
import Social from './Social';

const propTypes = {
	onShowHeaderDetails: PropTypes.func.isRequired,
	pubData: PropTypes.shape({
		membersData: PropTypes.shape({}),
		slug: PropTypes.string,
		isRelease: PropTypes.bool,
	}).isRequired,
	pubHeadings: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	updatePubData: PropTypes.func.isRequired,
};

const UtilityButtons = (props) => {
	const { onShowHeaderDetails, pubData, pubHeadings, updatePubData } = props;
	const { membersData, isRelease } = pubData;
	const { communityData, scopeData } = usePageContext();
	const { canManage } = scopeData.activePermissions;
	return (
		<div className="utility-buttons-component">
			<SmallHeaderButton
				className="show-header-details-button"
				icon="info-sign"
				onClick={onShowHeaderDetails}
			/>
			{canManage && !isRelease && (
				<PopoverButton
					component={PubThemePicker}
					updatePubData={updatePubData}
					pubData={pubData}
					communityData={communityData}
					aria-label="Pub header theme options"
				>
					<SmallHeaderButton label="Edit theme" labelPosition="left" icon="clean" />
				</PopoverButton>
			)}
			{canManage && (
				<SmallHeaderButton
					label="Pub settings"
					labelPosition="left"
					icon="cog"
					tagName="a"
					href={getDashUrl({ pubSlug: pubData.slug, mode: 'settings' })}
				/>
			)}
			{membersData && (
				<DialogLauncher
					renderLauncherElement={({ openDialog }) => (
						<SmallHeaderButton
							label="Sharing"
							labelPosition="left"
							icon="people"
							className="members-button"
							onClick={openDialog}
						/>
					)}
				>
					{({ isOpen, onClose }) => (
						<PubShareDialog isOpen={isOpen} onClose={onClose} pubData={pubData} />
					)}
				</DialogLauncher>
			)}
			<PopoverButton
				component={CitationsPreview}
				pubData={pubData}
				aria-label="Cite this Pub"
			>
				<SmallHeaderButton
					label="Cite"
					className="cite-button"
					labelPosition="left"
					icon="cite"
				/>
			</PopoverButton>
			{isRelease && (
				<Social pubData={pubData}>
					<SmallHeaderButton label="Social" labelPosition="left" icon="share2" />
				</Social>
			)}
			<Download pubData={pubData}>
				<SmallHeaderButton label="Download" labelPosition="left" icon="download2" />
			</Download>
			{pubHeadings.length > 0 && (
				<PubToc headings={pubHeadings}>
					<SmallHeaderButton label="Contents" labelPosition="left" icon="toc" />
				</PubToc>
			)}
		</div>
	);
};

UtilityButtons.propTypes = propTypes;
export default UtilityButtons;
