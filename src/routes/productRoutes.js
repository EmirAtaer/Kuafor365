const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.get("/", productController.getAllProducts);
router.post("/", productController.createProduct);
router.patch("/:id/stock", productController.updateStock);
router.patch("/:id/usage", productController.updateUsage);
router.delete("/:id", productController.deleteProduct);

module.exports = router;
