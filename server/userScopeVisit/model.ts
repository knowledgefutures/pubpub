import { Model, Table, Column, DataType, PrimaryKey, Default, Index } from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';

@Table
export class UserScopeVisit extends Model<
	InferAttributes<UserScopeVisit>,
	InferCreationAttributes<UserScopeVisit>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Index({ unique: true, name: 'user_scope_visits_user_id_collection_id' })
	@Index({ unique: true, name: 'user_scope_visits_user_id_pub_id' })
	@Column(DataType.UUID)
	userId!: string | null;

	@Index({ unique: true, name: 'user_scope_visits_user_id_pub_id' })
	@Column(DataType.UUID)
	pubId!: string | null;

	@Index({ unique: true, name: 'user_scope_visits_user_id_collection_id' })
	@Column(DataType.UUID)
	collectionId!: string | null;

	@Column(DataType.UUID)
	communityId!: string | null;
}
