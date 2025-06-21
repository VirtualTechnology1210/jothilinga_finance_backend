const { manager_credentials, roles, branch, sequelize } = require("../models");
const { Op } = require("sequelize");

module.exports = loginManager = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { username, password } = req.body;

    const manager = await manager_credentials.findOne({
      where: { username },
      transaction,
    });

    if (!manager) {
      await transaction.rollback();
      // If the user is not found, return an error
      return res.status(404).json({ error: "Invalid username." });
    }

    if (manager.password !== password) {
      await transaction.rollback();
      // If the passwords don't match, return an error
      return res.status(401).json({ error: "Invalid password." });
    }

    // Fetch role IDs for the allowed roles
    const allowedRoles = await roles.findAll({
      where: {
        roleName: {
          [Op.in]: [
            "Customer Relationship Officer",
            "Credit Officer",
            "Credit Manager",
            "Branch Manager",
          ],
        },
      },
      transaction,
    });

    const allowedRoleIds = allowedRoles.map((role) => role.id);

    if (!allowedRoleIds.includes(manager.roleId)) {
      await transaction.rollback();
      // If the role is not allowed, return an error
      return res.status(403).json({ error: "Unauthorized role." });
    }

    // Fetch all branches to match IDs with names
    const allBranches = await branch.findAll({
      attributes: ["id", "branchName"],
    });

    // Create a map of branch IDs to branch names for easy lookup
    const branchMap = allBranches.reduce((acc, branch) => {
      acc[branch.id] = branch.branchName;
      return acc;
    }, {});

    const branchNamesArray = manager.branchId
      .split(",") // Split the branchId string into an array of individual branch IDs
      .map((id) => branchMap[id.trim()]) // Map each branch ID to its corresponding branch name
      .filter(Boolean); // Filter out any null or undefined values

    // Commit the transaction if successful
    await transaction.commit();
    res.status(200).json({
      message: "Login successful.",
      user: {
        id: manager.id,
        username: manager.username,
      },
      userType: allowedRoles.find((role) => role.id === manager.roleId)
        .roleName,
      branchname: branchNamesArray,
    });
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
