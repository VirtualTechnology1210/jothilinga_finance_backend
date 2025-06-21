const { sequelize } = require("../models");
const models = require("../models");

module.exports = updateMeetingDetailsByBm = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { bmMeetingDayOrder, bmMeetingTime, id } = req.body;

    const updatedCenter = await models["center"].update(
      { bmMeetingDayOrder, bmMeetingTime },
      { where: { id } },
      { transaction }
    );

    const updatedMembers = await models["member_details"].update(
      { dayOrderByBranchManager: bmMeetingDayOrder },
      { where: { centerId: id } },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      message: "Meeting Details updated successfully!",
      updatedCenter,
      updatedMembers,
    });
  } catch (error) {
    await transaction.rollback();
    console.log(error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
};
