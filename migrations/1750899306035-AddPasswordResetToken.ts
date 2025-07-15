import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AddPasswordResetToken1750899306035 implements MigrationInterface {
  name = 'AddPasswordResetToken1750899306035';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'password_reset_tokens',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '150',
          },
          {
            name: 'token_hash',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
          },
          {
            name: 'used_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'IDX_password_reset_tokens_email',
            columnNames: ['email'],
            isUnique: true,
          },
          {
            name: 'IDX_password_reset_tokens_token_hash',
            columnNames: ['token_hash'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('password_reset_tokens');
  }
}
