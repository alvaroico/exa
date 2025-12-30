import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateMercadoPagoTable1704067200002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela mercadoPago
    await queryRunner.createTable(
      new Table({
        name: 'mercado_pago',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'paymentId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'preferenceId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'checkoutUrl',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'transactionId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'rawResponse',
            type: 'jsonb',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Adicionar chave estrangeira
    await queryRunner.createForeignKey(
      'mercado_pago',
      new TableForeignKey({
        columnNames: ['paymentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'payments',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover chave estrangeira
    const table = await queryRunner.getTable('mercado_pago');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('paymentId') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('mercado_pago', foreignKey);
    }

    // Remover tabela
    await queryRunner.dropTable('mercado_pago');
  }
}
