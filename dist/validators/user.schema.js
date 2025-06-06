"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserSchema = void 0;
// src/validators/user.schema.ts
const zod_1 = require("zod");
exports.registerUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    role: zod_1.z.enum(["hr", "interviewer"]),
    organization: zod_1.z.string(), // Can be name or ObjectId
    isNewOrg: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=user.schema.js.map