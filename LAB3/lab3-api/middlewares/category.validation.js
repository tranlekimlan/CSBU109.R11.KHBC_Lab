exports.validateCategoryName = (req, res, next) => {
    const { name } = req.body;

    if (!name || name.trim().length < 3) {
        return res.status(400).json ({
            success: false,
            message: 'Bad request: Category name must be at least 3 characters long'
        });
    }

    next();
};