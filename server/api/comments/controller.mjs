import db from "@/server/database/db";

export default async (req, res) => {
  const params = Object.fromEntries(
    new URLSearchParams(req.url.split("?")[1]).entries(),
  );

  const { from, to, reportId } = params;

  try {
    let filteredComments = await db.selectAll("comments");

    if (reportId) {
      filteredComments = filteredComments.filter(
        (comment) => comment.reportId === parseInt(reportId),
      );
    }

    const paginatedComments = filteredComments.slice(
      from ? Math.max(parseInt(from), 0) : 0,
      to
        ? Math.min(parseInt(to) + 1, filteredComments.length)
        : filteredComments.length,
    );

    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    res.end(JSON.stringify(paginatedComments));
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
};
