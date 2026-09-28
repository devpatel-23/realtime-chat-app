import { Router } from "express";
import authRoutes from "./auth.routes.js";
import healthRoutes from "./health.routes.js";
import messageRoutes from "./message.routes.js";
import userRoutes from "./user.routes.js";

const apiRouter = Router();

apiRouter.use("/", authRoutes);
apiRouter.use("/messages", messageRoutes);
apiRouter.use("/users", userRoutes);
apiRouter.use("/health", healthRoutes);

export { healthRoutes };
export default apiRouter;
