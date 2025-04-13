const express = require("express");
const router = express.Router();
const {
  getAllCampuses,
  getAllColleges,
  getAllDepartments,
  getSuggested,
  search,
} = require("../../controllers/search_controller");

router.route("/campus").get(getAllCampuses);
router.route("/college").get(getAllColleges);
router.route("/department").get(getAllDepartments);
router.route("/suggested").get(getSuggested);
router.route("/").get(search);

module.exports = router;
