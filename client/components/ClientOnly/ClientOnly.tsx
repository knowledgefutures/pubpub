import React from 'react';

type Props = {
	children: React.ReactNode;
	fallback?: React.ReactNode;
};

type ClientOnlyContextType = {
	isClientOnly: boolean;
};

export const ClientOnlyContext = React.createContext<ClientOnlyContextType>({
	isClientOnly: false,
});

const ClientOnly = (props: Props) => {
	const { children, fallback = null } = props;
	if (typeof window !== 'undefined') {
		return (
			<ClientOnlyContext.Provider value={{ isClientOnly: true }}>
				{children}
			</ClientOnlyContext.Provider>
		);
	}
	return <>{fallback}</>;
};

export default ClientOnly;
