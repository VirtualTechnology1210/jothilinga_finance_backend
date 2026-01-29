const { member_details, family_details } = require("../models");

module.exports = getMemberAndFamilyDetailsById = async (req, res) => {
  const memberId = req.params.memberId;

  try {
    const member = await member_details.findOne({
      where: { id: memberId },
      include: [
        {
          model: family_details,
          as: "familyMember", // Updated to match the one-to-one relationship alias
          attributes: ["id", "coApplicantName"],
        },
      ],
    });

    if (!member) {
      return res.status(404).json({
        error: "Member not found",
      });
    }

    // Extract the single familyMember if it exists
    const familyMember = member.familyMember;

    // Format the response
    const response = {
      member: {
        memberId: member.id,
        memberName: member.memberName,
        coApplicantId: familyMember ? familyMember.id : null,
        coApplicantName: familyMember ? familyMember.coApplicantName : null,
        loanType: member.loanType,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
