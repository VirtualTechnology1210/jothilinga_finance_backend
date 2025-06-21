const { nominee_photos } = require("../models");

module.exports = getNomineePhotosById = async (req, res) => {
  try {
    const memberId = req.params.memberId;

    // Fetch the nominee photos from the database
    const nomineePhotosRecord = await nominee_photos.findOne({
      where: {
        memberId: memberId,
      },
    });

    // Check if the record exists
    if (!nomineePhotosRecord) {
      return res.status(400).json({
        error: "Nominee Documents not found",
      });
    }

    return res.status(200).json({ message: nomineePhotosRecord });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
