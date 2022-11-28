import { notFoundError, requestError, unauthorizedError } from "@/errors";
import enrollmentRepository from "@/repositories/enrollment-repository";
import hotelsRepository from "@/repositories/hotels-repository.ts";
import ticketRepository from "@/repositories/ticket-repository";
import { TicketStatus } from "@prisma/client";
import enrollmentsService from "../enrollments-service";

async function getHotelsWithUserId(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) {
    throw unauthorizedError();
  }

  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  console.log(ticket);
  if (!ticket) {
    throw notFoundError();
  }

  if(ticket.TicketType.isRemote) {
    throw notFoundError();
  }
  if(!ticket.TicketType.includesHotel) {
    throw notFoundError();
  }

  if(ticket.status != TicketStatus.PAID) {
    throw notFoundError();
  }

  const hotels = await hotelsRepository.getAllHotels();
 
  return hotels;
}

async function findRoomsByHotel(hotelId: number) {
  const hotelRooms = await hotelsRepository.getRoomsByHotelId(hotelId);
  return hotelRooms;
}

const hotelsService = {
  getHotelsWithUserId,
  findRoomsByHotel
};

export default hotelsService;
