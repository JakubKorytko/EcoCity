const users = [
  {
    id: 0,
    name: "John Doe",
    avatar: "/public/images/avatars/user_0.jpg",
  },
  {
    id: 1,
    name: "Mike Chen",
    avatar: "/public/images/avatars/user_1.jpg",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    avatar: "/public/images/avatars/user_2.jpg",
  },
  {
    id: 3,
    name: "David Park",
    avatar: "/public/images/avatars/user_3.jpg",
  },
];

export default (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(users));
};
