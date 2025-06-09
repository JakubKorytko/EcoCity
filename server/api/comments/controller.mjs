const reportComments = [
  {
    id: 1,
    reportId: 0,
    authorId: 1,
    content:
      "I noticed the pollution levels are particularly high near the playground area. We need to take action quickly.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
  },
  {
    id: 2,
    reportId: 1,
    authorId: 2,
    content:
      "The factory emissions are affecting our health. We should report this to the local authorities.",
    createdAt: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    updatedAt: null,
  },
  {
    id: 3,
    reportId: 2,
    authorId: 3,
    content:
      "Illegal dumping is a serious issue. We need to gather more evidence and report it.",
    createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    updatedAt: Date.now() - 1000 * 60 * 60, // 1 hour ago
  },
  {
    id: 4,
    reportId: 3,
    authorId: 2,
    content:
      "Water contamination can have severe health impacts. We should escalate this issue immediately.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    updatedAt: null,
  },
  {
    id: 5,
    reportId: 0,
    authorId: 3,
    content:
      "I agree, the air quality is deteriorating. We need to raise awareness in the community.",
    createdAt: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
    updatedAt: null,
  },
  {
    id: 6,
    reportId: 1,
    authorId: 1,
    content:
      "Let's organize a community meeting to discuss this issue and find solutions.",
    createdAt: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
    updatedAt: null,
  },
  {
    id: 7,
    reportId: 2,
    authorId: 0,
    content:
      "I have seen similar issues in other areas. We should collaborate with environmental groups.",
    createdAt: Date.now() - 1000 * 60 * 60, // 1 hour ago
    updatedAt: null,
  },
  {
    id: 8,
    reportId: 3,
    authorId: 1,
    content:
      "The local government needs to take this seriously. We should petition for action.",
    createdAt: Date.now() - 1000 * 60 * 60 * 6, // 6 hours ago
    updatedAt: null,
  },
];

export default async (req, res) => {
  const params = Object.fromEntries(
    new URLSearchParams(req.url.split("?")[1]).entries(),
  );

  const { from, to, reportId } = params;

  let filteredComments = reportComments;
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
  res.end(JSON.stringify(paginatedComments));
};
