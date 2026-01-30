const fs = require("fs");
const path = require("path");

// Get model name from the command-line arguments
const modelName = process.argv[2]; // First argument is the model name

if (!modelName) {
  console.error("Please provide a model name.");
  process.exit(1);
}

// Function to generate migration template (without attributes)
const migrationTemplate = (modelName) => `
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('${modelName}s', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('${modelName}s');
  }
};
`;

// Function to generate model template (without attributes)
const modelTemplate = (modelName) => `
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ${modelName} extends Model {
    static associate(models) {
      // define association here
    }
  }

  ${modelName}.init({
    // Define attributes here
  }, {
    sequelize,
    modelName: '${modelName}',
  });

  return ${modelName};
};
`;

// Generate and save the migration and model files
const migrationFilename = path.join(
  __dirname,
  `migrations/${Date.now()}-create-${modelName.toLowerCase()}.js`
);
const modelFilename = path.join(
  __dirname,
  `models/${modelName.toLowerCase()}.js`
);

fs.writeFileSync(migrationFilename, migrationTemplate(modelName));
fs.writeFileSync(modelFilename, modelTemplate(modelName));

console.log(`Basic model and migration for ${modelName} generated.`);
