const db = require("../models");
const { sequelize } = require("../models");
const { Sequelize, Op } = require("sequelize");

module.exports = getCentersByManager = async (req, res) => {
  const managerId = req.query.managerId;
  const orConditions = req.query.orConditions
    ? JSON.parse(req.query.orConditions)
    : [];

  if (!managerId) {
    return res.status(400).json({
      error: "managerId query parameter is required.",
    });
  }

  try {
    const croRoleId = await db["roles"].findOne({
      where: { roleName: "Customer Relationship Officer" },
    });

    if (!croRoleId) {
      return res.status(400).json({
        error: "Role 'Customer Relationship Officer' does not exist.",
      });
    }

    const getBranchIds = await db["manager_credentials"].findOne({
      where: {
        id: managerId,
      },
    });

    if (!getBranchIds) {
      return res.status(400).json({
        error: "managerId not exist.",
      });
    }

    const branchIdsString = getBranchIds.branchId;
    let fieldManagerRecords;

    if (branchIdsString === null) {
      // Superadmin/Developer - Fetch all CRO records
      fieldManagerRecords = await db["manager_credentials"].findAll({
        attributes: ["id", "branchId", "username"],
        where: {
          roleId: croRoleId.id,
        },
        raw: true,
      });
    } else {
      // Restrict to specific branches
      fieldManagerRecords = await db["manager_credentials"].findAll({
        attributes: ["id", "branchId", "username"],
        where: {
          roleId: croRoleId.id,
          [Op.and]: sequelize.where(
            sequelize.fn(
              "FIND_IN_SET",
              sequelize.col("branchId"),
              branchIdsString
            ),
            {
              [Op.gt]: 0,
            }
          ),
        },
        raw: true,
      });
    }

    const fieldManagerIds = fieldManagerRecords.map((record) => record.id);

    const baseConditions = { ...req.query };
    delete baseConditions.managerId;
    delete baseConditions.orConditions;

    Object.keys(baseConditions).forEach((key) => {
      if (baseConditions[key] === "IS_NULL") {
        baseConditions[key] = { [Op.is]: null };
      } else if (typeof baseConditions[key] === "string") {
        baseConditions[key] = {
          [Op.in]: baseConditions[key].split(","),
        };
      }
    });

    const orConditionArray = orConditions.map((condition) => {
      const [column, value] = Object.entries(condition)[0]; // Extract key-value pair
      return { [column]: value };
    });

    const centers = await db["center"].findAll({
      where: {
        fieldManagerId: {
          [Op.in]: fieldManagerIds,
        },
      },
      include: [
        {
          model: db["group"],
          as: "fk_center_hasMany_group_centerId",
          include: [
            {
              model: db["member_details"],
              as: "fk_group_hasMany_member_details_groupId",
              where: {
                ...baseConditions,
                ...(orConditionArray.length > 0 && {
                  [Op.or]: orConditionArray,
                }),
              },
              required: false,
              include: [
                {
                  model: db["branch_manager_verification_photos"],
                  as: "branchManagerVerificationPhotosDetails",
                },
                {
                  model: db["proposed_loan_details"],
                  as: "proposedLoanDetails",
                },
              ],
            },
          ],
          required: false,
        },
      ],
    });

    // Extract all member IDs from centers
    const memberIds = new Set();
    centers.forEach((center) => {
      center.fk_center_hasMany_group_centerId.forEach((group) => {
        group.fk_group_hasMany_member_details_groupId.forEach((member) => {
          memberIds.add(member.id);
        });
      });
    });

    // Fetch all required details
    const [
      familyDetails,
      businessDetails,
      loanDetails,
      proposedLoanDetails,
      nomineePhotos,
      bankDetails,
      memberPhotos,
    ] = await Promise.all([
      db["family_details"].findAll({
        where: { memberId: { [Op.in]: Array.from(memberIds) } },
        attributes: ["memberId"],
        raw: true,
      }),
      db["member_business_details"].findAll({
        where: { ApplicantId: { [Op.in]: Array.from(memberIds) } },
        attributes: ["ApplicantId"],
        raw: true,
      }),
      db["loan_details"].findAll({
        where: { memberId: { [Op.in]: Array.from(memberIds) } },
        attributes: ["memberId"],
        raw: true,
      }),
      db["proposed_loan_details"].findAll({
        where: { memberId: { [Op.in]: Array.from(memberIds) } },
        attributes: ["memberId"],
        raw: true,
      }),
      db["nominee_photos"].findAll({
        where: { memberId: { [Op.in]: Array.from(memberIds) } },
        attributes: ["memberId"],
        raw: true,
      }),
      db["bank_details"].findAll({
        where: { memberId: { [Op.in]: Array.from(memberIds) } },
        attributes: ["memberId"],
        raw: true,
      }),
      db["member_photos"].findAll({
        where: { memberId: { [Op.in]: Array.from(memberIds) } },
        attributes: ["memberId"],
        raw: true,
      }),
    ]);

    // Convert to Sets for quick lookup
    const familyExists = new Set(familyDetails.map((row) => row.memberId));
    const businessExists = new Set(
      businessDetails.map((row) => row.ApplicantId)
    );
    const loanExists = new Set(loanDetails.map((row) => row.memberId));
    const proposedLoanExists = new Set(
      proposedLoanDetails.map((row) => row.memberId)
    );
    const nomineePhotoExists = new Set(
      nomineePhotos.map((row) => row.memberId)
    );
    const bankDetailsExists = new Set(bankDetails.map((row) => row.memberId));
    const photoExists = new Set(memberPhotos.map((row) => row.memberId));

    // Update response with `isValidForCroSubmission`
    const finalResponse = centers.map((center) => {
      return {
        ...center.get({ plain: true }),
        fk_center_hasMany_group_centerId:
          center.fk_center_hasMany_group_centerId.map((group) => {
            return {
              ...group.get({ plain: true }),
              fk_group_hasMany_member_details_groupId:
                group.fk_group_hasMany_member_details_groupId.map((member) => {
                  const memberObj = member.get({ plain: true });
                  memberObj.isValidForCroSubmission =
                    familyExists.has(memberObj.id) &&
                    businessExists.has(memberObj.id) &&
                    loanExists.has(memberObj.id) &&
                    proposedLoanExists.has(memberObj.id) &&
                    nomineePhotoExists.has(memberObj.id) &&
                    bankDetailsExists.has(memberObj.id) &&
                    photoExists.has(memberObj.id);
                  return memberObj;
                }),
            };
          }),
      };
    });

    // Send the response
    res.status(200).json({ data: finalResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
