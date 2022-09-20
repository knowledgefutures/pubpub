export type Config = {
	dbPath: string;
	dbName: string;
	username: string;
	password: string;
	drop: boolean;
};

export type PostgresHelper = {
	dropDbAndUser: () => Promise<void>;
	setupDbAndUser: () => Promise<void>;
	dbExists: () => Promise<boolean>;
	startDbServer: () => void;
	getDatabaseUrl: () => string;
};
