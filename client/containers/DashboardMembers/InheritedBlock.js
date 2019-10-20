import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';
import { Avatar } from 'components';
import MemberRow from './MemberRow';

require('./inheritedBlock.scss');

const propTypes = {
	members: PropTypes.object.isRequired,
	scope: PropTypes.string.isRequired,
};

const InheritedBlock = (props) => {
	const { members, scope } = props;
	const [isOpen, setIsOpen] = useState(false);
	return (
		<div className="inherited-block-component">
			<div className="top">
				<div className="scope">
					{scope} Members with access: {members.length}
				</div>
				<Button
					small
					text={isOpen ? 'Hide Details' : 'Show Details'}
					onClick={() => {
						setIsOpen(!isOpen);
					}}
				/>
			</div>
			{!isOpen && (
				<div className="preview-block">
					{members.map((member) => {
						return (
							<Avatar
								initials={member.user.initials}
								avatar={member.user.avatar}
								width={20}
							/>
						);
					})}
				</div>
			)}
			{isOpen && (
				<div className="members-block">
					{members.map((member) => {
						return <MemberRow memberData={member} isReadOnly={true} />;
					})}
				</div>
			)}
		</div>
	);
};

InheritedBlock.propTypes = propTypes;
export default InheritedBlock;
