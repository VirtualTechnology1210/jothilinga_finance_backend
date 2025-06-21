const { manager_credentials, branch, roles } = require("../models");

module.exports = getSanctionCommittee = async (req, res) => {
  try {
    const scRoleId = await roles.findOne({
      where: { roleName: "Sanction Committee" },
    });

    if (!scRoleId) {
      return res.status(400).json({
        error: "Role 'Sanction Committee' does not exist.",
      });
    }
    // Fetch all sanctionCommittee managers
    const sanctionCommittee = await manager_credentials.findAll({
      where: { roleId: scRoleId.id },
    });

    // Fetch all branches to match IDs with names
    const allBranches = await branch.findAll({
      attributes: ["id", "branchName"],
    });

    // Create a map of branch IDs to branch names for easy lookup
    const branchMap = allBranches.reduce((acc, branch) => {
      acc[branch.id] = branch.branchName;
      return acc;
    }, {});

    // Format the response
    const formattedResponse = sanctionCommittee.map((manager) => {
      // Parse branchIds and map them to branch names
      const branchNames = manager.branchId
        .split(",")
        .map((id) => branchMap[id.trim()])
        .filter(Boolean) // Filter out any null or undefined values
        .join(", "); // Join names into a comma-separated string

      return {
        id: manager.id,
        username: manager.username,
        password: manager.password, // Consider encrypting the password if needed
        employeeName: manager.employeeName,
        employeeId: manager.employeeId,
        roleId: scRoleId.roleName,
        branch_names: branchNames,
      };
    });

    res.status(200).json({
      sanctionCommittee: formattedResponse,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
