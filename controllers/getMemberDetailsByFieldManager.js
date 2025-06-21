const {
  member_details,
  family_details,
  member_business_details,
  loan_details,
  proposed_loan_details,
  member_photos,
  nominee_photos,
  bank_details,
  manager_credentials,
  branch,
} = require("../models");
const { Sequelize, Op } = require("sequelize");

module.exports = getMemberDetailsByFieldManager = async (req, res) => {
  const queryParams = req.query; // Get all query parameters

  try {
    // Build the `where` clause dynamically
    const whereClause = {};
    Object.keys(queryParams).forEach((key) => {
      if (key === "fieldManagerStatus" && Array.isArray(queryParams[key])) {
        whereClause[key] = { [Op.or]: queryParams[key] };
      } else {
        whereClause[key] = queryParams[key];
      }
    });

    // Fetch members
    const members = await member_details.findAll({
      where: whereClause,
      include: [
        {
          model: member_photos,
          as: "memberPhotoDetails",
          attributes: ["memberId", "memberPhoto"], // Fetch only required fields
        },
      ],
    });

    if (members.length === 0) {
      return res.status(200).json({ list: [] });
    }

    // Extract member IDs
    const memberIds = members.map((member) => member.id);

    // Fetch existence of child records
    const familyExists = new Set(
      (
        await family_details.findAll({
          where: { memberId: memberIds },
          attributes: ["memberId"],
          raw: true,
        })
      ).map((item) => item.memberId)
    );

    const businessExists = new Set(
      (
        await member_business_details.findAll({
          where: { ApplicantId: memberIds },
          attributes: ["ApplicantId"],
          raw: true,
        })
      ).map((item) => item.ApplicantId)
    );

    const loanExists = new Set(
      (
        await loan_details.findAll({
          where: { memberId: memberIds },
          attributes: ["memberId"],
          raw: true,
        })
      ).map((item) => item.memberId)
    );

    const proposedLoanExists = new Set(
      (
        await proposed_loan_details.findAll({
          where: { memberId: memberIds },
          attributes: ["memberId"],
          raw: true,
        })
      ).map((item) => item.memberId)
    );

    const nomineePhotoExists = new Set(
      (
        await nominee_photos.findAll({
          where: { memberId: memberIds },
          attributes: ["memberId"],
          raw: true,
        })
      ).map((item) => item.memberId)
    );

    const bankDetailsExists = new Set(
      (
        await bank_details.findAll({
          where: { memberId: memberIds },
          attributes: ["memberId"],
          raw: true,
        })
      ).map((item) => item.memberId)
    );

    const photoExists = new Set(
      (
        await member_photos.findAll({
          where: { memberId: memberIds },
          attributes: ["memberId"],
          raw: true,
        })
      ).map((item) => item.memberId)
    );

    // Fetch Branch Details
    const getBranchId = await manager_credentials.findOne({
      where: { id: req.query.fieldManagerId },
      attributes: ["branchId"],
    });

    if (!getBranchId) {
      return res.status(404).json({
        error: "Manager not found",
        message: `No manager found with id: ${req.query.fieldManagerId}`,
      });
    }

    const getBranchName = await branch.findOne({
      where: { id: getBranchId.branchId },
      attributes: ["branchName"],
    });

    if (!getBranchName) {
      return res.status(404).json({
        error: "Branch not found",
        message: `No branch found with id: ${getBranchId.branchId}`,
      });
    }

    // Format response
    const response = {
      list: members.map((member) => {
        const memberData = member.toJSON();

        // Remove child table data from the response
        delete memberData.memberPhotoDetails;

        return {
          ...memberData,
          branchName: getBranchName.branchName,
          memberPhoto: member.memberPhotoDetails
            ? member.memberPhotoDetails.memberPhoto
            : null,
          isValidForCroSubmission:
            familyExists.has(member.id) &&
            businessExists.has(member.id) &&
            loanExists.has(member.id) &&
            proposedLoanExists.has(member.id) &&
            nomineePhotoExists.has(member.id) &&
            bankDetailsExists.has(member.id) &&
            photoExists.has(member.id),
        };
      }),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};
