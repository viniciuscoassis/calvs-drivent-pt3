import { AuthenticatedRequest } from "@/middlewares";
import hotelsService from "@/services/hotels-service";
import { Response } from "express";
import httpStatus from "http-status";

async function getHotels(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  try{
    const hotels = await hotelsService.getHotelsWithUserId(userId);
    return res.status(httpStatus.OK).send(hotels);
  }
  catch (error) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}

async function getRoomsByHotelId(req: AuthenticatedRequest, res: Response) {
  const { hotelId } = req.params;

  if(!hotelId) return res.sendStatus(httpStatus.BAD_REQUEST);
  try{
    const hotelRooms = await hotelsService.findRoomsByHotel(Number(hotelId));
    return res.status(httpStatus.OK).send(hotelRooms);
  }  catch (error) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}

const hotelsController = {
  getHotels, getRoomsByHotelId
};
export default hotelsController;
