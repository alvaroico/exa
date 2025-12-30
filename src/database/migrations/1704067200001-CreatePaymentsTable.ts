import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreatePaymentsTable1704067200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'cpf',
            type: 'varchar',
            length: '11',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'paymentMethod',
            type: 'enum',
            enum: ['PIX', 'CREDIT_CARD'],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'PAID', 'FAIL'],
            default: "'PENDING'",
            isNullable: false,
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
        ],
      }),
      true,
    );

    // Criar trigger para impedir exclusão de pagamentos com status PAID
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION prevent_paid_payment_deletion()
      RETURNS TRIGGER AS $$
      BEGIN
        IF OLD.status = 'PAID' THEN
          RAISE EXCEPTION 'Não é possível deletar um pagamento com status PAID';
        END IF;
        RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER prevent_delete_paid_payment
      BEFORE DELETE ON payments
      FOR EACH ROW
      EXECUTE FUNCTION prevent_paid_payment_deletion();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS prevent_delete_paid_payment ON payments`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS prevent_paid_payment_deletion()`,
    );
    await queryRunner.dropTable('payments');
  }
}
