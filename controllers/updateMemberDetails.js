const {
  member_details,
  series,
  sequelize,
  manager_credentials,
  branch,
} = require("../models");
const { Sequelize } = require("sequelize");

module.exports = updateMemberDetails = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    if (!req.body.memberId) {
      return res.status(400).json({ error: "memberId is required." });
    }

    // Fetch the existing data for memberId
    const existingMemberDetails = await member_details.findOne({
      where: { id: req.body.memberId },
      transaction,
    });

    if (!existingMemberDetails) {
      await transaction.rollback();
      return res.status(404).json({ error: "Member not found." });
    }

    // Prepare the payload for updating
    const payload = { ...req.body };

    console.log("payload: " + JSON.stringify(payload));

    // List of message fields to append if they exist in the request body
    const messageFields = [
      "fieldManagerMessage",
      "branchManagerMessage",
      "creditOfficerMessage",
      "misMessage",
      "creditManagerMessage",
      "sanctionCommitteeMessage",
      "accountManagerMessage",
    ];

    // Iterate over each message field and append the new message if it exists in req.body
    messageFields.forEach((field) => {
      if (req.body[field]) {
        // Append the new message to the existing one if it exists, or set the new message
        payload[field] = existingMemberDetails[field]
          ? existingMemberDetails[field] + req.body[field]
          : req.body[field];
      }
    });

    if (req.body.loanId === "") {
      // Fetch the next number for loanId series
      const getLoanIdNextNo = await series.findOne({
        where: { seriesName: "loanId" },
        transaction,
      });

      let loanIdNextNumber = getLoanIdNextNo.nextNumber;

      // Get the branchId from fieldManagerId
      const fieldManager = await manager_credentials.findOne({
        where: { id: existingMemberDetails.fieldManagerId },
        attributes: ["branchId"],
        transaction,
      });

      if (!fieldManager || !fieldManager.branchId) {
        throw new Error("Invalid fieldManagerId or branchId not found");
      }

      // Fetch branchCode from branch table using branchId
      const branchData = await branch.findOne({
        where: { id: fieldManager.branchId },
        attributes: ["branchCode"],
        transaction,
      });

      if (!branchData || !branchData.branchCode) {
        throw new Error("Invalid branchId or branchCode not found");
      }

      // Generate the loanId with branchCode + next loanId number
      const newLoanId = `1111${branchData.branchCode}${String(
        loanIdNextNumber
      ).padStart(4, "0")}`;

      payload["loanId"] = newLoanId;

      // Increment the customerId series nextNumber by 1 and update the series table
      await series.update(
        { nextNumber: loanIdNextNumber + 1 },
        { where: { seriesName: "loanId" }, transaction }
      );
    }

    // Create a new row
    await member_details.update(
      payload,
      { where: { id: req.body.memberId } },
      { transaction }
    );

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Member Details updated successfully.",
    });
  } catch (error) {
    // Rollback the transaction if there's an error
    await transaction.rollback();

    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
