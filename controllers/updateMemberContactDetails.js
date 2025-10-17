const { member_details, family_details } = require("../models");

module.exports = updateMemberContactDetails = async (req, res) => {
  const { memberId, memberDetails, nomineeDetails, reasonForChange } = req.body;

  try {
    // Validate required fields
    if (!memberId) {
      return res.status(400).json({ error: "Member ID is required." });
    }

    // Validate reason for change (mandatory)
    if (!reasonForChange || reasonForChange.trim() === "") {
      return res.status(400).json({ error: "Reason for change is required." });
    }

    // Check if member exists
    const member = await member_details.findOne({
      where: { id: memberId },
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found." });
    }

    // Update member contact details
    if (memberDetails) {
      const updateData = {};
      
      // Only update provided fields
      if (memberDetails.phoneNumber !== undefined) {
        updateData.phoneNumber = memberDetails.phoneNumber;
      }
      if (memberDetails.permanentDoorNo !== undefined) {
        updateData.permanentDoorNo = memberDetails.permanentDoorNo;
      }
      if (memberDetails.permanentStreetNo !== undefined) {
        updateData.permanentStreetNo = memberDetails.permanentStreetNo;
      }
      if (memberDetails.permanentPanchayat !== undefined) {
        updateData.permanentPanchayat = memberDetails.permanentPanchayat;
      }
      if (memberDetails.permanentTaluk !== undefined) {
        updateData.permanentTaluk = memberDetails.permanentTaluk;
      }
      if (memberDetails.permanentDistrict !== undefined) {
        updateData.permanentDistrict = memberDetails.permanentDistrict;
      }
      if (memberDetails.permanentPincode !== undefined) {
        updateData.permanentPincode = memberDetails.permanentPincode;
      }
      if (memberDetails.currentDoorNo !== undefined) {
        updateData.currentDoorNo = memberDetails.currentDoorNo;
      }
      if (memberDetails.currentStreetNo !== undefined) {
        updateData.currentStreetNo = memberDetails.currentStreetNo;
      }
      if (memberDetails.currentPanchayat !== undefined) {
        updateData.currentPanchayat = memberDetails.currentPanchayat;
      }
      if (memberDetails.currentTaluk !== undefined) {
        updateData.currentTaluk = memberDetails.currentTaluk;
      }
      if (memberDetails.currentDistrict !== undefined) {
        updateData.currentDistrict = memberDetails.currentDistrict;
      }
      if (memberDetails.currentPincode !== undefined) {
        updateData.currentPincode = memberDetails.currentPincode;
      }

      // Add reason for change and timestamp
      updateData.reasonForContactChange = reasonForChange.trim();
      updateData.contactChangeUpdatedAt = new Date();

      await member_details.update(updateData, {
        where: { id: memberId },
      });
    }

    // Update nominee contact details
    if (nomineeDetails) {
      const nominee = await family_details.findOne({
        where: { memberId: memberId },
      });

      if (nominee) {
        const updateData = {};
        
        // Only update provided fields
        if (nomineeDetails.phoneNumber !== undefined) {
          updateData.phoneNumber = nomineeDetails.phoneNumber;
        }
        if (nomineeDetails.permanentDoorNo !== undefined) {
          updateData.permanentDoorNo = nomineeDetails.permanentDoorNo;
        }
        if (nomineeDetails.permanentStreetNo !== undefined) {
          updateData.permanentStreetNo = nomineeDetails.permanentStreetNo;
        }
        if (nomineeDetails.permanentPanchayat !== undefined) {
          updateData.permanentPanchayat = nomineeDetails.permanentPanchayat;
        }
        if (nomineeDetails.permanentTaluk !== undefined) {
          updateData.permanentTaluk = nomineeDetails.permanentTaluk;
        }
        if (nomineeDetails.permanentDistrict !== undefined) {
          updateData.permanentDistrict = nomineeDetails.permanentDistrict;
        }
        if (nomineeDetails.permanentPincode !== undefined) {
          updateData.permanentPincode = nomineeDetails.permanentPincode;
        }
        if (nomineeDetails.currentDoorNo !== undefined) {
          updateData.currentDoorNo = nomineeDetails.currentDoorNo;
        }
        if (nomineeDetails.currentStreetNo !== undefined) {
          updateData.currentStreetNo = nomineeDetails.currentStreetNo;
        }
        if (nomineeDetails.currentPanchayat !== undefined) {
          updateData.currentPanchayat = nomineeDetails.currentPanchayat;
        }
        if (nomineeDetails.currentTaluk !== undefined) {
          updateData.currentTaluk = nomineeDetails.currentTaluk;
        }
        if (nomineeDetails.currentDistrict !== undefined) {
          updateData.currentDistrict = nomineeDetails.currentDistrict;
        }
        if (nomineeDetails.currentPincode !== undefined) {
          updateData.currentPincode = nomineeDetails.currentPincode;
        }

        await family_details.update(updateData, {
          where: { memberId: memberId },
        });
      }
    }

    res.status(200).json({
      message: "Contact details updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
