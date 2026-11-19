'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("product_options", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      shape: {
        type: Sequelize.ENUM("square", "circle"),
        allowNull: false,
      },

      radius: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      type: {
        type: Sequelize.ENUM("text", "color"),
        allowNull: false,
      },

      values: {
        type: Sequelize.JSON,
        allowNull: false,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("product_options");
  },
};
