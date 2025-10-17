const { member_details } = require("../models");
const { Op } = require("sequelize");

module.exports = searchMembersByInput = async (req, res) => {
  try {
    const { searchInput } = req.body;
    let results = null;

    console.log("searchInput: " + searchInput);

    results = await member_details.findAll({
      where: {
        [Op.or]: [
          { customerId: { [Op.like]: `%${searchInput}%` } },
          { phoneNumber: { [Op.like]: `%${searchInput}%` } },
          { aadharNo: { [Op.like]: `%${searchInput}%` } },
        ],
      },
      attributes: ["customerId", "phoneNumber", "aadharNo", "memberName"],
    });
    // console.log("results: " + JSON.stringify(results));
    res.json({ message: results });
  } catch (error) {
    res.json({ error: "Internal Server Error" });
  }
};
