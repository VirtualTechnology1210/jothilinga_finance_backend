const { Op } = require("sequelize");
const models = require("../models"); // Import all models dynamically

module.exports = searchByInput = async (req, res) => {
  try {
    const { modelName, attributes, searchConditions } = req.body;

    if (!modelName || !attributes || !searchConditions) {
      return res.status(400).json({
        error: "Please provide modelName, attributes, and searchConditions.",
      });
    }

    // Validate if the model exists
    const Model = models[modelName];
    if (!Model) {
      return res
        .status(400)
        .json({ error: `Model "${modelName}" does not exist.` });
    }

    // Build dynamic WHERE clause
    const whereClause = searchConditions.map(({ field, operator, value }) => {
      if (!field || !operator) {
        throw new Error(
          "Each search condition must have a 'field' and 'operator'."
        );
      }
      return {
        [field]: { [Op[operator]]: operator === "like" ? `%${value}%` : value },
      };
    });

    // Combine all conditions with `AND`
    const queryCondition = { [Op.and]: whereClause };

    // Perform the query
    const results = await Model.findAll({
      where: queryCondition,
      attributes,
    });

    res.json({ message: results });
  } catch (error) {
    console.error("Error in searchMembersByInput:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
