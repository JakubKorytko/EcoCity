export default (req, res) => {
  const params = Object.fromEntries(
    new URLSearchParams(req.url.split("?")[1]).entries(),
  );

  const { from, to, id } = params;

  if (id) {
    const userId = parseInt(id);
    const user = users.find((user) => user.id === userId);
    if (!user) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "User not found" }));
      return;
    }

    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(user));
    return;
  }

  const paginatedUsers = users.slice(
    from ? Math.max(parseInt(from), 0) : 0,
    to ? Math.min(parseInt(to) + 1, users.length) : users.length,
  );

  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(users));
};
