const { sequelize } = require("../models");
const models = require("../models");

module.exports = updateCenterTimes = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { data } = req.body;

    // Fetch all centers to validate against existing data
    const allCenters = await models["center"].findAll({ transaction });

    // Loop through each center in the data
    for (const center of data) {
      const { centerId, newTime } = center;

      // Fetch the current center's details
      const currentCenter = allCenters.find((c) => c.id === centerId);
      if (!currentCenter) {
        await transaction.rollback();
        return res.json({
          error: `Center with ID ${centerId} not found.`,
        });
      }

      const { bmMeetingDayOrder } = currentCenter;

      // Check if the combination of bmMeetingDayOrder and newTime already exists
      const existingCenter = allCenters.find(
        (c) =>
          c.bmMeetingDayOrder === bmMeetingDayOrder &&
          c.bmMeetingTime === newTime &&
          c.id !== centerId // Exclude the current center from the check
      );

      if (existingCenter) {
        await transaction.rollback();
        return res.json({
          error: `The combination of day order ${bmMeetingDayOrder} and time ${newTime} already exists for center ${existingCenter.name}.`,
        });
      }

      // Validate 30-minute gap for the same bmMeetingDayOrder
      const conflictingCenters = allCenters.filter(
        (c) =>
          c.bmMeetingDayOrder === bmMeetingDayOrder &&
          c.id !== centerId && // Exclude the current center
          Math.abs(
            new Date(`1970-01-01T${c.bmMeetingTime}`) -
              new Date(`1970-01-01T${newTime}`)
          ) <
            30 * 60 * 1000 // 30 minutes in milliseconds
      );

      if (conflictingCenters.length > 0) {
        await transaction.rollback();
        return res.json({
          error: `The new time ${newTime} for center ${
            currentCenter.name
          } conflicts with the following centers: ${conflictingCenters
            .map((c) => c.name)
            .join(", ")}. Please ensure a 30-minute gap.`,
        });
      }

      // Update the center's bmMeetingTime
      await models["center"].update(
        { bmMeetingTime: newTime }, // Fields to update
        { where: { id: centerId }, transaction } // Options object
      );
    }

    // Commit the transaction if all updates are successful
    await transaction.commit();

    // Send success response
    res.status(200).json({
      message: "Meeting Details updated successfully!",
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();

    // Log the full error for debugging
    console.error("Error updating center times:", error);

    // Send error response
    res.status(400).json({ error: error });
  }
};
