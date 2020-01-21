import React from 'react';
import { Button } from 'reakit';

export const ControlsButton = (props) => {
	return <Button className="controls-button" {...props} />;
};

// eslint-disable-next-line react/prop-types
export const ControlsButtonGroup = ({ children }) => {
	return <div className="controls-button-group">{children}</div>;
};
