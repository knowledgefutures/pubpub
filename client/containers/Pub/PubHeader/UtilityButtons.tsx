import React from 'react';

import { usePageContext } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';
import { DialogLauncher, PubThemePicker, PubShareDialog } from 'components';

import CitationsPreview from './CitationsPreview';
import Download from './Download';
import PopoverButton from './PopoverButton';
import PubToc from './PubToc';
import SmallHeaderButton from './SmallHeaderButton';
import Social from './Social';

type Props = {
	onShowHeaderDetails: (...args: any[]) => any;
	pubData: {
		membersData?: {};
		slug?: string;
		isRelease?: boolean;
	};
	pubHeadings: {}[];
	updatePubData: (...args: any[]) => any;
};

const UtilityButtons = (props: Props) => {
	const { onShowHeaderDetails, pubData, pubHeadings, updatePubData } = props;
	const { membersData, isRelease } = pubData;
	const { communityData, scopeData } = usePageContext();
	const { canManage } = scopeData.activePermissions;
	return (
		<div className="utility-buttons-component">
			<SmallHeaderButton
				// @ts-expect-error ts-migrate(2322) FIXME: Property 'className' does not exist on type 'Intri... Remove this comment to see the full error message
				className="show-header-details-button"
				icon="info-sign"
				onClick={onShowHeaderDetails}
			/>
			{canManage && !isRelease && (
				<PopoverButton
					component={PubThemePicker}
					// @ts-expect-error ts-migrate(2322) FIXME: Property 'updatePubData' does not exist on type 'I... Remove this comment to see the full error message
					updatePubData={updatePubData}
					pubData={pubData}
					communityData={communityData}
					aria-label="Pub header theme options"
				>
					{/* @ts-expect-error ts-migrate(2322) FIXME: Property 'label' does not exist on type 'Intrinsic... Remove this comment to see the full error message */}
					<SmallHeaderButton label="Edit theme" labelPosition="left" icon="clean" />
				</PopoverButton>
			)}
			{canManage && (
				<SmallHeaderButton
					// @ts-expect-error ts-migrate(2322) FIXME: Property 'label' does not exist on type 'Intrinsic... Remove this comment to see the full error message
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
							// @ts-expect-error ts-migrate(2322) FIXME: Property 'label' does not exist on type 'Intrinsic... Remove this comment to see the full error message
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
				// @ts-expect-error ts-migrate(2322) FIXME: Property 'pubData' does not exist on type 'Intrins... Remove this comment to see the full error message
				pubData={pubData}
				aria-label="Cite this Pub"
			>
				<SmallHeaderButton
					// @ts-expect-error ts-migrate(2322) FIXME: Property 'label' does not exist on type 'Intrinsic... Remove this comment to see the full error message
					label="Cite"
					className="cite-button"
					labelPosition="left"
					icon="cite"
				/>
			</PopoverButton>
			{isRelease && (
				<Social pubData={pubData}>
					{/* @ts-expect-error ts-migrate(2322) FIXME: Property 'label' does not exist on type 'Intrinsic... Remove this comment to see the full error message */}
					<SmallHeaderButton label="Social" labelPosition="left" icon="share2" />
				</Social>
			)}
			<Download pubData={pubData}>
				{/* @ts-expect-error ts-migrate(2322) FIXME: Property 'label' does not exist on type 'Intrinsic... Remove this comment to see the full error message */}
				<SmallHeaderButton label="Download" labelPosition="left" icon="download2" />
			</Download>
			{pubHeadings.length > 0 && (
				// @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message
				<PubToc headings={pubHeadings}>
					{/* @ts-expect-error ts-migrate(2322) FIXME: Property 'label' does not exist on type 'Intrinsic... Remove this comment to see the full error message */}
					<SmallHeaderButton label="Contents" labelPosition="left" icon="toc" />
				</PubToc>
			)}
		</div>
	);
};
export default UtilityButtons;
