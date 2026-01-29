const { manager_credentials, branch, roles } = require("../models");

module.exports = getAccountsManagers = async (req, res) => {
  try {
    const role = await roles.findOne({
      where: { roleName: "Accounts Manager" },
    });

    if (!role) {
      return res.status(400).json({
        error: "Role does not exist.",
      });
    }
    // Fetch all  managers
    const managers = await manager_credentials.findAll({
      where: { roleId: role.id },
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
    const formattedResponse = managers.map((manager) => {
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
        roleId: role.roleName,
        branch_names: branchNames,
      };
    });

    res.status(200).json({
      accountsManager: formattedResponse,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
