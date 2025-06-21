const {
  member_details,
  series,
  sequelize,
  manager_credentials,
  branch,
} = require("../models");
const { Op } = require("sequelize");

module.exports = updateMemberDetailsByMemberId = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    if (!req.body.memberId) {
      return res.status(400).json({ error: "memberId is required." });
    }

    const { id, ...updateData } = req.body;

    if (updateData.customerType === "New") {
      // Fetch the next number for customerId series
      const getCustomerIdNextNo = await series.findOne({
        where: { seriesName: "customerId" },
        transaction,
      });

      let customerIdNextNumber = getCustomerIdNextNo.nextNumber;

      // Get the branchId from fieldManagerId
      const fieldManager = await manager_credentials.findOne({
        where: { id: updateData.fieldManagerId },
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

      // Generate the customerId with branchCode + next customerId number
      const newCustomerId = `${branchData.branchCode}${String(
        customerIdNextNumber
      ).padStart(4, "0")}`;

      // Assign the new customerId to updateData
      updateData.customerId = newCustomerId;

      // Increment the customerId series nextNumber by 1 and update the series table
      // await series.update(
      //   { nextNumber: customerIdNextNumber + 1 },
      //   { where: { seriesName: "customerId" }, transaction }
      // );
      await series.update(
        { nextNumber: nextNumber + 1 },
        { where: { seriesName: "customerId" }, transaction }
      );
    }

    // Check for uniqueness of aadharNo and phoneNumber
    const existingAadharNoMember = await member_details.findOne({
      where: {
        aadharNo: updateData.aadharNo,
        customerId: { [Op.ne]: updateData.customerId }, // Ensure we ignore the current member
      },
      transaction,
    });

    const existingPhoneNoMember = await member_details.findOne({
      where: {
        phoneNumber: updateData.phoneNumber,
        customerId: { [Op.ne]: updateData.customerId }, // Ensure we ignore the current member
      },
      transaction,
    });

    // Handle duplicate aadharNo
    if (existingAadharNoMember) {
      return res.status(400).json({
        error: "A member with the same Aadhar number already exists.",
      });
    }

    // Handle duplicate phoneNo
    if (existingPhoneNoMember) {
      return res
        .status(400)
        .json({ error: "A member with the same Phone number already exists." });
    }

    await member_details.update(
      updateData,
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
