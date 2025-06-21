const {
  member_details,
  series,
  sequelize,
  manager_credentials,
  branch,
} = require("../models");
const { Op } = require("sequelize");

module.exports = addMemberDetails = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const formData = req.body;

    // Fetch the current next number for the "applicationId" series
    const getSeriesNextNo = await series.findOne({
      where: { seriesName: "applicationId" },
      transaction,
    });

    let nextNumber = getSeriesNextNo.nextNumber;

    // Generate the ApplicationId with leading zeros (pad to 10 digits)
    const newApplicationId = String(nextNumber).padStart(10, "0");

    // Add the generated ApplicationId to the formData
    formData.ApplicationId = newApplicationId;

    // Conditional customerId generation if customerType is 'New'
    if (formData.customerType === "New") {
      // Fetch the next number for customerId series
      const getCustomerIdNextNo = await series.findOne({
        where: { seriesName: "customerId" },
        transaction,
      });

      let customerIdNextNumber = getCustomerIdNextNo.nextNumber;

      // Get the branchId from fieldManagerId
      const fieldManager = await manager_credentials.findOne({
        where: { id: formData.fieldManagerId },
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

      // Assign the new customerId to formData
      formData.customerId = newCustomerId;

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

    // Check for uniqueness of aadharNo and phoneNo separately
    const existingAadharNoMember = await member_details.findOne({
      where: {
        aadharNo: formData.aadharNo,
        customerId: {
          [Op.ne]: formData.customerId, // Ensure we ignore the current customer
        },
      },
      transaction,
    });

    const existingPhoneNoMember = await member_details.findOne({
      where: {
        phoneNumber: formData.phoneNumber,
        customerId: {
          [Op.ne]: formData.customerId, // Ensure we ignore the current customer
        },
      },
      transaction,
    });

    // Handle duplicate aadharNo
    if (existingAadharNoMember) {
      throw new Error("A member with the same Aadhar number already exists.");
    }

    // Handle duplicate phoneNo
    if (existingPhoneNoMember) {
      throw new Error("A member with the same Phone number already exists.");
    }

    const newMember = await member_details.create(formData, {
      transaction,
    });

    // Increment the series nextNumber by 1 and update the series table
    await series.update(
      { nextNumber: nextNumber + 1 },
      { where: { seriesName: "applicationId" }, transaction }
    );

    // Commit the transaction if successful
    await transaction.commit();

    res.status(200).json({
      message: "Member details submitted successfully.",
      memberdetails: newMember,
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
