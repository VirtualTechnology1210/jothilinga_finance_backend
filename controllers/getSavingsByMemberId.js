const models = require("../models");

const getSavingsByMemberId = async (req, res) => {
  try {
    const { memberId } = req.query;

    if (!memberId) {
      return res.status(400).json({ 
        error: "memberId is required" 
      });
    }

    // Get all savings for the member
    const savings = await models["savings"].findAll({
      where: { memberId },
      include: [
        {
          model: models["member_details"],
          as: "memberDetails",
          attributes: ["id", "ApplicationId", "memberName", "securityDeposit"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Calculate total savings
    const totalSavings = savings.reduce((sum, saving) => {
      return sum + parseFloat(saving.savingAmount || 0);
    }, 0);

    res.status(200).json({
      message: "Savings retrieved successfully",
      data: savings,
      totalSavings,
    });
  } catch (error) {
    console.error("Error retrieving savings:", error);
    res.status(500).json({ 
      error: "An error occurred while retrieving savings. Please try again." 
    });
  }
};

module.exports = getSavingsByMemberId;
