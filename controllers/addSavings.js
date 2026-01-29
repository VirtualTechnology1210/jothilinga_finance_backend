const models = require("../models");
const { sequelize } = require("../models");

const addSavings = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { memberId, savingAmount } = req.body;

    // Validate required fields
    if (!memberId || !savingAmount) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: "memberId and savingAmount are required" 
      });
    }

    // Check if member exists
    const member = await models["member_details"].findOne({
      where: { id: memberId },
      transaction,
    });

    if (!member) {
      await transaction.rollback();
      return res.status(404).json({ 
        error: "Member not found" 
      });
    }

    // Check if member has security deposit
    if (!member.securityDeposit || member.securityDeposit <= 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: "Member does not have a security deposit" 
      });
    }

    // Validate saving amount doesn't exceed security deposit
    if (parseFloat(savingAmount) > parseFloat(member.securityDeposit)) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: `Saving amount cannot exceed security deposit of ${member.securityDeposit}` 
      });
    }

    // Create savings record
    const savings = await models["savings"].create(
      {
        memberId,
        savingAmount,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      message: "Savings added successfully",
      data: savings,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error adding savings:", error);
    res.status(500).json({ 
      error: "An error occurred while adding savings. Please try again." 
    });
  }
};

module.exports = addSavings;
