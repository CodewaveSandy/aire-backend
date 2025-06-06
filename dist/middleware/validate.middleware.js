"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body); // parses & validates
        next();
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            message: "Validation Error",
            errors: err.errors || err.message,
        });
    }
};
exports.validate = validate;
//# sourceMappingURL=validate.middleware.js.map