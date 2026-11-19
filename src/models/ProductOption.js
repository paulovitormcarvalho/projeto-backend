const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProductOption = sequelize.define(
  "ProductOption",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "products",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    shape: {
      type: DataTypes.ENUM("square", "circle"),
      allowNull: false,
    },

    radius: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    type: {
      type: DataTypes.ENUM("text", "color"),
      allowNull: false,
    },

    values: {
      type: DataTypes.STRING(255),
      allowNull: false,
      get() {
        const value = this.getDataValue("values");
        return value ? value.split(",") : [];
      },
      set(value) {
        if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.includes(","))) {
          throw new Error("values deve ser uma lista de textos sem vírgulas.");
        }
        this.setDataValue("values", value.join(","));
      },
    },
  },
  {
    tableName: "product_options",
    timestamps: true,
  }
);

module.exports = ProductOption;