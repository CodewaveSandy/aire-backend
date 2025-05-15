"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.failedResponse = exports.successResponse = void 0;
const successResponse = (res, data, message = "Success") => {
    return res.status(200).json({
        status: "SUCCESS",
        message,
        data,
    });
};
exports.successResponse = successResponse;
const failedResponse = (res, message, errors) => {
    return res.status(400).json({
        status: "FAILURE",
        message,
        errors,
    });
};
exports.failedResponse = failedResponse;
const errorResponse = (res, message, statusCode = 500) => {
    return res.status(statusCode).json({
        status: "ERROR",
        message,
    });
};
exports.errorResponse = errorResponse;
//# sourceMappingURL=response.utils.js.map