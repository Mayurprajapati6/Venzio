import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export function authorizeRoles(...allowedRoles: Array<"ADMIN" | "OWNER" | "USER">) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if(!req.user) {
            return res.status(401).json({message: "Unauthorized"});
        }

        if(!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Forbidden"
            });
        }

        next();
    };
}