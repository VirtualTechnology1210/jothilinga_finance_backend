const { member_photos } = require("../models");

module.exports = getMemberPhotosById = async (req, res) => {
  try {
    const memberId = req.params.memberId;

    // Fetch the member photos from the database
    const memberPhotosRecord = await member_photos.findOne({
      where: {
        memberId: memberId,
      },
    });

    // Check if the record exists
    if (!memberPhotosRecord) {
      return res.status(400).json({
        message: "Member Documents not found",
      });
    }

    return res.status(200).json({ message: memberPhotosRecord });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
