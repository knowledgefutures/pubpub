import React, { useContext } from 'react';
import { NotificationsContext } from './types';

export const UserNotificationsContext = React.createContext<null | NotificationsContext>(null);

export const useNotificationsContext = () => {
	const context = useContext(UserNotificationsContext);
	return context!;
};
