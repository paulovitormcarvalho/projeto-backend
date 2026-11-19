'use strict';

// Converte values de JSON para VARCHAR(255), sem descartar linhas existentes.
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'product_options';
    await queryInterface.addColumn(table, 'values_csv', { type: Sequelize.STRING(255), allowNull: true });
    const [rows] = await queryInterface.sequelize.query('SELECT `id`, `values` FROM `product_options`');
    for (const row of rows) {
      let list = row.values;
      if (Buffer.isBuffer(list)) list = list.toString('utf8');
      if (typeof list === 'string') {
        try { list = JSON.parse(list); } catch { list = list.split(','); }
      }
      if (!Array.isArray(list) || list.some((v) => typeof v !== 'string' || v.includes(','))) {
        throw new Error(`Não foi possível converter values da opção ${row.id}. Verifique os dados antes de migrar.`);
      }
      const csv = list.join(',');
      if (csv.length > 255) throw new Error(`A opção ${row.id} excede 255 caracteres em values.`);
      await queryInterface.bulkUpdate(table, { values_csv: csv }, { id: row.id });
    }
    await queryInterface.changeColumn(table, 'values_csv', { type: Sequelize.STRING(255), allowNull: false });
    await queryInterface.removeColumn(table, 'values');
    await queryInterface.renameColumn(table, 'values_csv', 'values');
  },
  async down(queryInterface, Sequelize) {
    const table = 'product_options';
    await queryInterface.addColumn(table, 'values_json', { type: Sequelize.JSON, allowNull: true });
    const [rows] = await queryInterface.sequelize.query('SELECT `id`, `values` FROM `product_options`');
    for (const row of rows) {
      const list = String(row.values ?? '').split(',').filter(Boolean);
      await queryInterface.bulkUpdate(table, { values_json: JSON.stringify(list) }, { id: row.id });
    }
    await queryInterface.changeColumn(table, 'values_json', { type: Sequelize.JSON, allowNull: false });
    await queryInterface.removeColumn(table, 'values');
    await queryInterface.renameColumn(table, 'values_json', 'values');
  },
};
