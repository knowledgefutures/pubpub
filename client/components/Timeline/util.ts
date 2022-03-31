import React from 'react';

export const TimelineContext = React.createContext<{ accentColor?: string }>({
	accentColor: undefined,
});
