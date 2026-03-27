const UserService = require("./user.service");

/* ---------------- LIST ---------------- */
async function list(req, res, next) {
  try {

    const users = await UserService.listUsers(req.query);

    res.json({
      success: true,
      data: users,
    });

  } catch (err) {
    next(err);
  }
}

/* ---------------- GET ONE ---------------- */
async function getOne(req, res, next) {
  try {

    const user = await UserService.getUser(req.params.id);

    res.json({
      success: true,
      data: user,
    });

  } catch (err) {
    next(err);
  }
}

/* ---------------- CREATE ---------------- */
async function create(req, res, next) {
  try {

    const user = await UserService.createUser(req.body);

    res.status(201).json({
      success: true,
      message: "User Invited Successfully.",
      data: user,
    });

  } catch (err) {
    next(err);
  }
}

/* modules/iam/users/user.controller.js */

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Verification token is missing." });
    }

    const result = await UserService.verifyUserToken(token);

    return res.status(200).json({
      status: "success",
      message: result.message
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message
    });
  }
};

/* ---------------- UPDATE ---------------- */
async function update(req, res, next) {
  try {

    const user = await UserService.updateUser(
      req.params.id,
      req.body
    );

    res.json({
      success: true,
      data: user,
    });

  } catch (err) {
    next(err);
  }
}

/* ---------------- DELETE (SOFT) ---------------- */
async function remove(req, res, next) {
  try {

    await UserService.deleteUser(req.params.id);

    res.json({
      success: true,
      message: "User deleted",
    });

  } catch (err) {
    next(err);
  }
}

/* ---------------- RESTORE ---------------- */
async function restore(req, res, next) {
  try {

    await UserService.restoreUser(req.params.id);

    res.json({
      success: true,
      message: "User restored",
    });

  } catch (err) {
    next(err);
  }
}

/* ---------------- PERMANENT DELETE ---------------- */
async function permanentDelete(req, res, next) {
  try {

    await UserService.permanentDeleteUser(req.params.id);

    res.json({
      success: true,
      message: "User permanently deleted",
    });

  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getOne,
  create,
  verifyEmail,
  update,
  remove,
  restore,
  permanentDelete,
};