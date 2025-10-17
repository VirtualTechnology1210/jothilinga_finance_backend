const { bank_details, member_photos } = require("../models");

module.exports = getBankDetails = async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const getBankDetails = await bank_details.findOne({
      where: { memberId },
    });

    const getBankPassbook = await member_photos.findOne({
      where: { memberId },
      attributes: ["bankPassbookPhoto"],
    });

    if (getBankDetails) {
      getBankDetails.dataValues.bankPassbookPhoto =
        getBankPassbook?.bankPassbookPhoto || null;
    }

    res.status(200).json({
      bankDetails: getBankDetails,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
