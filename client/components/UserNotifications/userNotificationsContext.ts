import type { NotificationsContext } from './types';

import React, { useContext } from 'react';

export const UserNotificationsContext = React.createContext<null | NotificationsContext>(null);

export const useNotificationsContext = () => {
	const context = useContext(UserNotificationsContext);
	return context!;
};
