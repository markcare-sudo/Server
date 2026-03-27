// modules/menu/menu.controller.js

const asyncHandler = require("../../utils/asyncHandler");
const MenuService = require("./menu.service");

const getMenu = asyncHandler(async (req, res) => {
  const user = req.user; // from auth middleware

  const menu = await MenuService.getUserMenu(user);

  return res.status(200).json({
    success: true,
    data: menu,
  });
});

module.exports = {
  getMenu,
};