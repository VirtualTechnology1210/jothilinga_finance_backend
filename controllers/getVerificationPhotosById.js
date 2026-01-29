const {
  branch_manager_verification_photos_static,
  credit_officer_verification_photos_static,
} = require("../models");

module.exports = getVerificationPhotosById = async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const role = req.params.role;
    let memberPhotosRecord;

    if (role === "branchManager") {
      memberPhotosRecord =
        await branch_manager_verification_photos_static.findOne({
          where: {
            memberId: memberId,
          },
        });
    }
    if (role === "creditOfficer") {
      memberPhotosRecord =
        await credit_officer_verification_photos_static.findOne({
          where: {
            memberId: memberId,
          },
        });
    }

    // Check if the record exists
    if (!memberPhotosRecord) {
      return res.json({
        error: "verification Documents not found",
      });
    }

    return res.json({ message: memberPhotosRecord });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
