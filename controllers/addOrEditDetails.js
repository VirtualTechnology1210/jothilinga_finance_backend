const { sequelize } = require("../models");
const models = require("../models");

module.exports = addOrEditDetails = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { model, whereConditions, denominations, ...formData } = req.body;

    if (!models[model]) {
      return res.status(400).json({ error: "Invalid model provided." });
    }

    const selectedModel = models[model];

    console.log(
      `Checking for existing record in ${model} with conditions: ${JSON.stringify(
        whereConditions
      )}`
    );

    // Find existing record based on where conditions
    const existingRecord = await selectedModel.findOne({
      where: whereConditions,
      transaction,
    });

    let savedData;
    let action;

    if (existingRecord) {
      // Update existing record
      action = "updated";
      savedData = await selectedModel.update(formData, {
        where: whereConditions,
        transaction,
      });

      // For Sequelize, we need to fetch the updated record to return it
      savedData = await selectedModel.findOne({
        where: whereConditions,
        transaction,
      });
    } else {
      // Create new record combining where conditions and form data
      const createData = { ...whereConditions, ...formData };
      action = "created";
      savedData = await selectedModel.create(createData, { transaction });
    }

    // Handle denominations if provided
    if (denominations && model === "booking_process_bm") {
      // Delete existing denominations if updating
      if (existingRecord) {
        await models.booking_process_denominations.destroy({
          where: { bookingProcessId: existingRecord.id },
          transaction,
        });
      }

      // Create new denominations
      if (denominations.length > 0) {
        await models.booking_process_denominations.bulkCreate(
          denominations.map((denom) => ({
            ...denom,
            bookingProcessId: savedData.id,
          })),
          { transaction }
        );
      }
    }

    await transaction.commit();

    res.status(200).json({
      message: `Record ${action} successfully!`,
      savedData: savedData,
      action: action,
    });
  } catch (error) {
    await transaction.rollback();
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        error: "Unique constraint violation.",
        details: error.errors.map((e) => e.message),
      });
    }
    console.log(error);
    res.status(500).json({
      error: "An error occurred. Please try again.",
      details: error.message,
    });
  }
};
