export const up = async ({ Sequelize, sequelize }) => {
	const qi = sequelize.queryInterface;

	// add version column to Drafts
	const draftsDesc = await qi.describeTable('Drafts');
	if (!draftsDesc.version) {
		await qi.addColumn('Drafts', 'version', {
			type: Sequelize.INTEGER,
			allowNull: false,
			defaultValue: 0,
		});
	}

	// make firebasePath nullable (was NOT NULL before)
	if (draftsDesc.firebasePath && !draftsDesc.firebasePath.allowNull) {
		await qi.changeColumn('Drafts', 'firebasePath', {
			type: Sequelize.STRING,
			allowNull: true,
		});
	}

	// create CollabCommits table
	const tableExists = await qi.describeTable('CollabCommits').catch(() => null);
	if (!tableExists) {
		await qi.createTable('CollabCommits', {
			id: {
				type: Sequelize.UUID,
				primaryKey: true,
				defaultValue: Sequelize.UUIDV4,
			},
			draftId: {
				type: Sequelize.UUID,
				allowNull: false,
				references: { model: 'Drafts', key: 'id' },
				onDelete: 'CASCADE',
			},
			version: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			ref: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
			steps: {
				type: Sequelize.JSONB,
				allowNull: false,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		await qi.addConstraint('CollabCommits', {
			fields: ['draftId', 'version'],
			type: 'unique',
			name: 'collab_commits_draft_version_unique',
		});

		await qi.addIndex('CollabCommits', ['draftId', 'ref'], {
			name: 'collab_commits_draft_ref_idx',
		});

		await qi.addIndex('CollabCommits', ['draftId', 'version'], {
			name: 'collab_commits_draft_version_idx',
		});
	}
};

export const down = async ({ Sequelize, sequelize }) => {
	const qi = sequelize.queryInterface;

	await qi.dropTable('CollabCommits').catch(() => {});

	const draftsDesc = await qi.describeTable('Drafts');

	if (draftsDesc.version) {
		await qi.removeColumn('Drafts', 'version');
	}

	if (draftsDesc.firebasePath) {
		await qi.changeColumn('Drafts', 'firebasePath', {
			type: Sequelize.STRING,
			allowNull: false,
		});
	}
};
