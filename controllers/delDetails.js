const { sequelize, Sequelize } = require("../models");
const models = require("../models");

module.exports = delDetails = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { model, where } = req.body;

    if (!models[model]) {
      return res.status(400).json({ error: "Invalid model provided." });
    }

    const selectedModel = models[model];

    // Ensure `where` is provided and is an object
    if (!where || typeof where !== "object") {
      return res
        .status(400)
        .json({ error: "Invalid or missing 'where' condition." });
    }

    // Replace Sequelize operators in the `where` clause
    const processedWhere = JSON.parse(
      JSON.stringify(where).replace(
        /"\$(\w+)"/g,
        (_, op) => `"${Sequelize.Op[op]}"`
      )
    );

    const del_result = await selectedModel.destroy({
      where: processedWhere, // Use the processed where condition
      transaction,
    });

    if (del_result === 0) {
      return res
        .status(404)
        .json({ error: "No data found for the provided conditions." });
    }

    await transaction.commit();

    res.status(200).json({
      message: "Details deleted successfully!",
      deletedCount: del_result,
    });
  } catch (error) {
    await transaction.rollback();
    console.log(error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};
