const fs = require("fs");
const path = require("path");
const {
  sequelize,
  member_details,
  family_details,
  member_business_details,
  family_business_details,
  loan_details,
  proposed_loan_details,
  bank_details,
  member_photos,
  nominee_photos,
  branch_manager_verification_photos,
  credit_officer_verification_photos,
  credit_officer_verification_data,
  branch_manager_verification_photos_static,
  credit_officer_verification_photos_static,
  receipts,
} = require("../models");

// Helper function to delete files
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Delete the file if it exists
      console.log(`Deleted: ${filePath}`);
    }
  } catch (err) {
    console.log(`Error deleting file ${filePath}:`, err);
  }
};

module.exports = delMember = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { memberId } = req.body;
    console.log("memberId in delMember: " + memberId);

    if (!memberId) {
      return res.status(400).json({ error: "memberId is required." });
    }

    const baseDir = path.join(__dirname, "../uploads/documents");

    // Helper function to fetch and store photo paths
    const fetchPhotosFromModel = async (model, fields) => {
      const photos = await model.findOne({ where: { memberId } });
      const photoPaths = [];
      if (photos) {
        fields.forEach((field) => {
          const photoPath = photos[field];
          if (photoPath) {
            const fullPath = path.join(baseDir, photoPath);
            photoPaths.push(fullPath);
          }
        });
      }
      return photoPaths;
    };

    // Collect all photo paths
    const memberPhotos = await fetchPhotosFromModel(member_photos, [
      "memberPhoto",
      "aadharFrontPhoto",
      "aadharBackPhoto",
      "anotherIdentityPhoto",
      "rationCardPhoto",
      "bankPassbookPhoto",
      "businessProofPhoto",
      "ownHouseProofPhoto",
      "applicantLinkProofPhoto",
      "signaturePhoto",
      "other1",
      "other2",
      "other3",
    ]);

    const nomineePhotos = await fetchPhotosFromModel(nominee_photos, [
      "nomineePhoto",
      "aadharFrontPhoto",
      "aadharBackPhoto",
      "anotherIdentityPhoto",
      "rationCardPhoto",
      "bankPassbookPhoto",
      "salaryProofPhoto",
      "ownHouseProofPhoto",
      "applicantLinkProofPhoto",
      "signaturePhoto",
      "other1",
      "other2",
      "other3",
    ]);

    const branchManagerVerificationPhotosStatic = await fetchPhotosFromModel(
      branch_manager_verification_photos_static,
      [
        "housePhoto1",
        "housePhoto2",
        "businessPhoto1",
        "businessPhoto2",
        "businessPhoto3",
        "businessPhoto4",
        "other1",
        "other2",
      ]
    );

    const creditOfficerVerificationPhotosStatic = await fetchPhotosFromModel(
      credit_officer_verification_photos_static,
      [
        "housePhoto1",
        "housePhoto2",
        "businessPhoto1",
        "businessPhoto2",
        "businessPhoto3",
        "businessPhoto4",
        "other1",
        "other2",
      ]
    );

    // Fetch and store photo paths from branch_manager_verification_photos
    const branchManagerVerificationPhotos =
      await branch_manager_verification_photos.findAll({ where: { memberId } });
    const branchManagerPhotos = branchManagerVerificationPhotos.map(
      (photo) => path.join(baseDir, photo.fileName) // Assuming `fileName` holds the file path
    );

    // Fetch and store photo paths from credit_officer_verification_photos
    const creditOfficerVerificationPhotos =
      await credit_officer_verification_photos.findAll({ where: { memberId } });
    const creditOfficerPhotos = creditOfficerVerificationPhotos.map((photo) =>
      path.join(baseDir, photo.fileName)
    );

    // Fetch cbReport, coApplicantCbReport, pdf1, pdf2 from member_details
    const memberDetails = await member_details.findOne({
      where: { id: memberId },
    });
    const pdfFields = ["cbReport", "coApplicantCbReport", "pdf1", "pdf2"];
    const pdfPaths = [];

    if (memberDetails) {
      pdfFields.forEach((field) => {
        const pdfFile = memberDetails[field];
        if (pdfFile) {
          const pdfFullPath = path.join(baseDir, pdfFile);
          pdfPaths.push(pdfFullPath);
        }
      });
    }

    // Combine all photo paths into one array
    const allPhotoPaths = [
      ...memberPhotos,
      ...nomineePhotos,
      ...branchManagerVerificationPhotosStatic,
      ...creditOfficerVerificationPhotosStatic,
      ...branchManagerPhotos,
      ...creditOfficerPhotos,
      ...pdfPaths,
    ];

    // Define an array of models and their respective foreign key fields
    const models = [
      { model: member_business_details, key: "ApplicantId" },
      { model: family_business_details, key: "memberId" },
      { model: family_details, key: "memberId" },
      { model: loan_details, key: "memberId" },
      { model: proposed_loan_details, key: "memberId" },
      { model: bank_details, key: "memberId" },
      { model: member_photos, key: "memberId" },
      { model: nominee_photos, key: "memberId" },
      { model: branch_manager_verification_photos, key: "memberId" },
      { model: credit_officer_verification_photos, key: "memberId" },
      { model: credit_officer_verification_data, key: "memberId" },
      { model: branch_manager_verification_photos_static, key: "memberId" },
      { model: credit_officer_verification_photos_static, key: "memberId" },
      { model: receipts, key: "memberId" },
    ];

    // Perform all deletions in parallel
    await Promise.all(
      models.map(({ model, key }) =>
        model.destroy({ where: { [key]: memberId }, transaction })
      )
    );

    const member_details_result = await member_details.destroy({
      where: { id: memberId },
      transaction,
    });

    if (member_details_result === 0) {
      return res
        .status(404)
        .json({ error: "No data found for the provided id." });
    }
    // Commit the transaction
    await transaction.commit();

    // After the transaction is committed, delete the files
    allPhotoPaths.forEach(deleteFile);

    res.status(200).json({ message: "Data and files deleted successfully." });
  } catch (error) {
    // Rollback the transaction if there's an error
    await transaction.rollback();
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
