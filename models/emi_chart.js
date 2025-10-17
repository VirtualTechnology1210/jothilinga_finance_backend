"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class emi_charts extends Sequelize.Model {
    static associate(models) {
      // define association here
      emi_charts.belongsTo(models.member_details, {
        foreignKey: "memberId",
        as: "fk_emi_charts_belongsTo_member_details_memberId",
      });
    }
  }

  emi_charts.init(
    {
      // Define attributes here
      memberId: {
        type: Sequelize.INTEGER,
        // references: { model: "member_details", key: "id" },
        allowNull: false,
      },
      loanAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      loanDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      emiDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      tenureMonths: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          isIn: [[6, 10, 12, 18, 24]],
        },
      },
      emiChart: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      totalInterest: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      totalAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('draft', 'submitted', 'approved', 'rejected', 'active', 'completed'),
        defaultValue: 'submitted',
      },
    },
    {
      sequelize,
      modelName: "emi_charts",
      freezeTableName: true,
      hooks: {
        beforeSave: async (emiChart, options) => {
         
          if (emiChart.emiChart && Array.isArray(emiChart.emiChart)) {
            const chart = emiChart.emiChart;
            
     
            const totalInterest = chart.reduce((sum, item) => {
              return sum + parseFloat(item.interestAmount || 0);
            }, 0);
            
        
            const totalAmount = chart.reduce((sum, item) => {
              return sum + parseFloat(item.emiAmount || 0);
            }, 0);
            
            emiChart.totalInterest = totalInterest.toFixed(2);
            emiChart.totalAmount = totalAmount.toFixed(2);
          }
        }
      }
    }
  );

  return emi_charts;
};
