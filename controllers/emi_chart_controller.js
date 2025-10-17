const { emi_charts } = require("../models");


exports.getByMemberId = async (req, res) => {
  const { memberId } = req.params;

  try {
    const charts = await emi_charts.findAll({
      where: { memberId },
      order: [["loanDate", "DESC"]],
    });

    if (!charts.length) {
      return res.status(404).json({ message: "No EMI charts found for this member." });
    }

    res.status(200).json(charts);
  } catch (error) {
    console.error("Error fetching EMI chart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



exports.createEmiChart = async (req, res) => {
  try {
    const newChart = await emi_charts.create(req.body);
    res.status(201).json(newChart);
  } catch (error) {
    console.error("Error creating EMI chart:", error);
    res.status(500).json({ message: "Error creating EMI chart", error });
  }
};
