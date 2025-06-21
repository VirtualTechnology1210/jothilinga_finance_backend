const {
  member_details,
  member_photos,
  manager_credentials,
  branch,
} = require("../models");

module.exports = getStatusList = async (req, res) => {
  const fieldManagerId = req.params.id;
  const queryParams = req.query; // Get all query parameters

  try {
    // Build the `where` clause dynamically
    const whereClause = { fieldManagerId };

    // console.log("fieldManagerId: " + JSON.stringify(fieldManagerId));
    // console.log("queryParams: " + JSON.stringify(queryParams));

    // Add the query parameters to the where clause if they exist
    if (queryParams.accountManagerStatus) {
      whereClause.accountManagerStatus = queryParams.accountManagerStatus;
    }
    if (queryParams.creditManagerStatus) {
      whereClause.creditManagerStatus = queryParams.creditManagerStatus;
    }

    // Fetch members with the dynamic where clause
    const members = await member_details.findAll({
      where: whereClause,
      include: [
        {
          model: member_photos,
          as: "memberPhotoDetails", // Ensure this alias matches the association alias
        },
      ],
    });

    // console.log("members: " + JSON.stringify(members));

    const getBranchId = await manager_credentials.findOne({
      where: {
        id: fieldManagerId,
      },
    });

    if (!getBranchId) {
      return res.status(404).json({
        error: "Manager not found",
        message: `No manager found with id: ${fieldManagerId}`,
      });
    }

    // console.log("getBranchId: " + JSON.stringify(getBranchId));

    const getBranchName = await branch.findOne({
      where: {
        id: getBranchId.branchId,
      },
    });

    // Check if getBranchName is null
    if (!getBranchName) {
      return res.status(404).json({
        error: "Branch not found",
        message: `No branch found with id: ${getBranchId.branchId}`,
      });
    }

    // console.log("getBranchName: " + JSON.stringify(getBranchName));

    // Format the result to match the required structure
    const response = {
      list: members.map((member) => ({
        member_id: member.id, // Adjust if `id` is named differently in your model
        memberName: member.memberName,
        memberPhoneNumber: member.phoneNumber,
        appliedDate: member.createdAt.toISOString().split("T")[0], // Format date to YYYY-MM-DD
        creditOfficerMessage: member.creditOfficerMessage,
        branchName: getBranchName.branchName,
        memberPhoto: member.memberPhotoDetails
          ? member.memberPhotoDetails.memberPhoto
          : null,
        creditOfficerStatus: member.creditOfficerStatus,
        creditOfficerStatusUpdatedAt: member.creditOfficerStatusUpdatedAt,
        creditOfficerMessage: member.creditOfficerMessage,
        creditManagerStatus: member.creditManagerStatus,
        creditManagerStatusUpdatedAt: member.creditManagerStatusUpdatedAt,
        branchManagerStatus: member.branchManagerStatus,
        branchManagerStatusUpdatedAt: member.branchManagerStatusUpdatedAt,
        accountManagerStatus: member.accountManagerStatus,
        accountManagerStatusUpdatedAt: member.accountManagerStatusUpdatedAt,
        ApplicantionId: member.ApplicantionId,
        fieldManagerMessage: member.fieldManagerMessage,
      })),
    };

    // console.log("response: " + JSON.stringify(response));

    res.status(200).json(response);
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
