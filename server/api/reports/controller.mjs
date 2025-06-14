import db from "@/server/database/db";

export default async (req, res) => {
  const params = Object.fromEntries(
    new URLSearchParams(req.url.split("?")[1]).entries(),
  );

  const { from, to, id } = params;

  try {
    if (id) {
      const reportId = parseInt(id);
      const reports = await db.selectWhere("reports", { id: reportId });

      if (reports.length === 0) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Report not found" }));
        return;
      }

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(reports[0]));
      return;
    }

    const allReports = await db.selectAll("reports");
    const paginatedReports = allReports.slice(
      from ? Math.max(parseInt(from), 0) : 0,
      to ? Math.min(parseInt(to) + 1, allReports.length) : allReports.length,
    );

    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(paginatedReports));
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
};
