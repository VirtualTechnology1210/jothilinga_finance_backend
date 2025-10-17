const { credit_documents } = require("../models");

module.exports = getCreditDocumentsById = async (req, res) => {
  try {
    const memberId = req.params.memberId;

    // Fetch the credit_documents from the database
    const memberPhotosRecord = await credit_documents.findOne({
      where: {
        memberId: memberId,
      },
      attributes: [
        "memberId",
        "creditManagerId",
        "businessPhoto",
        "housePhoto",
        "neighbourCheckPhoto",
        "tradeReferencePhoto",
      ],
      raw: true, // Retrieve the plain object instead of the Sequelize instance
    });

    // Check if the record exists
    if (!memberPhotosRecord) {
      return res.status(400).json({
        error: "Documents not found",
      });
    }

    // Convert comma-separated values to arrays
    const response = {
      businessPhoto: memberPhotosRecord.businessPhoto
        ? memberPhotosRecord.businessPhoto.split(",")
        : [],
      housePhoto: memberPhotosRecord.housePhoto
        ? memberPhotosRecord.housePhoto.split(",")
        : [],
      neighbourCheckPhoto: memberPhotosRecord.neighbourCheckPhoto
        ? memberPhotosRecord.neighbourCheckPhoto.split(",")
        : [],
      tradeReferencePhoto: memberPhotosRecord.tradeReferencePhoto
        ? memberPhotosRecord.tradeReferencePhoto.split(",")
        : [],
      memberId: memberPhotosRecord.memberId,
      CreditManagerId: memberPhotosRecord.creditManagerId,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
