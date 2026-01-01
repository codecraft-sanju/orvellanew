const express = require("express");
const { 
  registerUser, 
  loginUser, 
  logout, 
  getUserDetails, 
  getAllUsers, 
  updateUserRole, 
  deleteUser 
} = require("../controllers/userController");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// --- Public Routes ---
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(logout);

// --- Protected Routes (Login Required) ---
router.route("/me").get(isAuthenticatedUser, getUserDetails);

// --- Admin Routes ---
router.route("/admin/users").get(isAuthenticatedUser, authorizeRoles("admin"), getAllUsers);

router.route("/admin/user/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateUserRole)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);

module.exports = router;