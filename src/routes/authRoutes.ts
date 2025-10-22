import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import { ValidationError } from "../errors";
import AuthMiddleware from "../middleware/AuthMiddleware";
import {
    UserLoginSchema,
    UserRegistrationSchema,
    validateData,
} from "../validators/auth.validator";

const authRouter = Router();

authRouter.post(
    "/register",
    validateData(UserRegistrationSchema),
    AuthController.createUser
);

authRouter.post(
    "/login",
    validateData(UserLoginSchema),
    AuthController.loginUser
);

authRouter.post("/logout", (req, res) => {
    console.log(req.body);

    res.send("hello from logout");
});

authRouter.post(
    "/refresh-token",
    AuthMiddleware.refreshTokenValidation,
    AuthController.refreshAccessToken
);

authRouter.get("/verify-email", AuthController.verifyUserMail);
authRouter.get("/reset-password", (req, res) => {
    const { token, email } = req.query;

    if (!token || typeof token !== "string") {
        throw new ValidationError("Invalid token");
    }

    res.send(token + email + " reset password");
});

export default authRouter;

// async function unifiedLogout(req: Request, res: Response, next: NextFunction) {
//     try {
//         let tokensCleared = false;

//         if (req.cookies.accessToken && (req as JWTAuthenticatedRequest).user) {
//             const { userId } = (req as JWTAuthenticatedRequest).user!;

//             await prisma.refreshToken.deleteMany({
//                 where: { userId },
//             });

//             tokensCleared = true;
//         }

//         // clear custom auth tokens
//         res.clearCookie("accessToken", { ...baseCookieOptions, maxAge: 0 });
//         res.clearCookie("refreshToken", {
//             ...baseCookieOptions,
//             path: "/api/auth/refresh",
//             maxAge: 0,
//         });

//         return res.status(200).json({
//             success: true,
//             message: "logged out successfully",
//             details: { tokensCleared },
//         });
//     } catch (error) {
//         console.error("logout error:", error);
//         next(error);
//     }
// }
