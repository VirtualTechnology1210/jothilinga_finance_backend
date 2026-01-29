const { member_details, family_details } = require("../models");

module.exports = getMemberContactDetails = async (req, res) => {
  const memberId = req.params.memberId;

  try {
    // Fetch member details with only contact information
    const member = await member_details.findOne({
      where: { id: memberId },
      attributes: [
        "id",
        "phoneNumber",
        "permanentDoorNo",
        "permanentStreetNo",
        "permanentPanchayat",
        "permanentTaluk",
        "permanentDistrict",
        "permanentPincode",
        "currentDoorNo",
        "currentStreetNo",
        "currentPanchayat",
        "currentTaluk",
        "currentDistrict",
        "currentPincode",
        "latitude",
        "longitude",
      ],
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found." });
    }

    // Fetch nominee (family) details with only contact information
    const nominee = await family_details.findOne({
      where: { memberId: memberId },
      attributes: [
        "id",
        "phoneNumber",
        "permanentDoorNo",
        "permanentStreetNo",
        "permanentPanchayat",
        "permanentTaluk",
        "permanentDistrict",
        "permanentPincode",
        "currentDoorNo",
        "currentStreetNo",
        "currentPanchayat",
        "currentTaluk",
        "currentDistrict",
        "currentPincode",
      ],
    });

    // Structure the response
    const response = {
      memberDetails: member ? member.get() : null,
      nomineeDetails: nominee ? nominee.get() : null,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
