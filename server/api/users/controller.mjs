import db from "@/server/database/db";

export default async (req, res) => {
  const params = Object.fromEntries(
    new URLSearchParams(req.url.split("?")[1]).entries(),
  );

  const { from, to, id } = params;

  try {
    if (id) {
      const userId = parseInt(id);
      const userDetails = await db.selectWhere("userDetails", { id: userId });

      if (userDetails.length === 0) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "User not found" }));
        return;
      }

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(userDetails[0]));
      return;
    }

    const allUserDetails = await db.selectAll("userDetails");
    const paginatedUsers = allUserDetails.slice(
      from ? Math.max(parseInt(from), 0) : 0,
      to
        ? Math.min(parseInt(to) + 1, allUserDetails.length)
        : allUserDetails.length,
    );

    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(paginatedUsers));
  } catch (error) {
    console.error("Error fetching users:", error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
};
