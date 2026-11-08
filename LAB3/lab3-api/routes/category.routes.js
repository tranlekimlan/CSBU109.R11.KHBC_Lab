const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { validateCategoryName } = require('../middlewares/category.validation');

/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Category management endpoints
 * components:
 *   parameters:
 *     CategoryIdParam:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: Category ID
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID from MongoDB
 *         name:
 *           type: string
 *           example: "Home & Living"
 *         slug:
 *           type: string
 *           example: "home-living"
 *         description:
 *           type: string
 *           example: "Furniture and home decor items"
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get the list of categories (with pagination)
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Current page (default = 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page (default = 5)
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Bad request / Validation error
 */

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryIdParam'
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       400:
 *         description: Malformed ID
 *       404:
 *         description: Category not found
 *   put:
 *     summary: Update a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Bad request / Malformed ID
 *       404:
 *         description: Category not found to update
 *   delete:
 *     summary: Delete a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryIdParam'
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Malformed ID
 *       404:
 *         description: Category not found to delete
 */

router.get('/', categoryController.getAllCategories);
router.post('/', validateCategoryName, categoryController.createCategory);
router.get('/:id', categoryController.getCategoryById);
router.put('/:id', validateCategoryName, categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;