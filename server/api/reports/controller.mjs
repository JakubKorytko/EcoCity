import db from "@/server/api/db";

export default async (req, res) => {
  const params = Object.fromEntries(
    new URLSearchParams(req.url.split("?")[1]).entries(),
  );

  const { from, to, id } = params;

  if (id) {
    const reportId = parseInt(id);
    const report = db.reports.find((report) => report.id === reportId);

    if (!report) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "Report not found" }));
      return;
    }

    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(report));
    return;
  }

  const paginatedReports = db.reports.slice(
    from ? Math.max(parseInt(from), 0) : 0,
    to ? Math.min(parseInt(to) + 1, db.reports.length) : db.reports.length,
  );

  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(paginatedReports));
};
