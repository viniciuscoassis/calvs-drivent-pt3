import hotelsController from "@/controllers/hotels-controller";
import { authenticateToken } from "@/middlewares";
import { Router } from "express";

const hotelsRouter = Router();

hotelsRouter.all("/*", authenticateToken);
hotelsRouter.get("/", hotelsController.getHotels);
hotelsRouter.get("/:hotelId", hotelsController.getRoomsByHotelId);

export default hotelsRouter;
