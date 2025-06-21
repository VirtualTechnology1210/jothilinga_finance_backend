const {
  member_details,
  member_business_details,
  receipts,
  sequelize,
} = require("../models");
const { Sequelize, Op } = require("sequelize");

module.exports = getMembersForEuc = async (req, res) => {
  try {
    const { fieldManagerId } = req.query;

    if (!fieldManagerId) {
      return res.status(400).json({ error: "fieldManagerId is required" });
    }

    const membersForEuc = await member_details.findAll({
      attributes: [
        "id", // member_details.id
        "memberName", // member_details.memberName
        "branchManagerStatusUpdatedAt", // member_details.branchManagerStatusUpdatedAt
      ],
      where: {
        branchManagerStatus: "disbursed",
        fieldManagerId,
        [Op.or]: [{ isEucDone: false }, { isEucDone: null }],
      },
      include: [
        {
          model: member_business_details,
          as: "businessDetails", // Ensure this alias matches the association alias
          attributes: ["natureOfBusiness"], // Only include natureOfBusiness from businessDetails
        },
        {
          model: receipts,
          as: "receiptsDetails", // Ensure this alias matches the association alias
          where: {
            status: "paid",
          },
          required: true, // Ensure that only members with at least one paid receipt are included
          attributes: [], // Exclude all fields from receiptsDetails in the response
        },
      ],
      having: sequelize.literal("COUNT(receiptsDetails.id) >= 2"), // Filter members with at least 2 paid receipts
      group: ["member_details.id", "businessDetails.id"], // Add businessDetails.id to GROUP BY
    });

    res.status(200).json(membersForEuc);
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
