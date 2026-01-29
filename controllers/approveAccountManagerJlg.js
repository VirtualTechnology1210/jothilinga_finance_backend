const { sequelize } = require("../models");
const models = require("../models");

module.exports = approveAccountManagerJlg = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      updatedFedLanNos,
      centerId,
      amStatus,
      amMessage,
      amStatusUpdatedAt,
    } = req.body;

    await models["center"].update(
      { amStatus, amMessage, amStatusUpdatedAt },
      { where: { id: centerId }, transaction }
    );

    const updatePromises = Object.entries(updatedFedLanNos).map(
      async ([memberId, fedLanNo]) => {
        await models["member_details"].update(
          { fedLanNo },
          { where: { id: memberId }, transaction }
        );
      }
    );

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    // Commit the transaction
    await transaction.commit();

    res.status(201).json({
      message: "Details updated successfully for all members!",
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};
