import app, { init } from "@/app";
import faker from "@faker-js/faker";
import httpStatus from "http-status";
import supertest from "supertest";
import {
  createCustomTicketType,
  createEnrollmentWithAddress,
  createTicket,
  createTicketType,
  createUser,
} from "../factories";
import { cleanDb, generateValidToken } from "../helpers";
import * as jwt from "jsonwebtoken";
import { TicketStatus } from "@prisma/client";
import { createHotel, findHotelWithRooms } from "../factories/hotels-factory";
import { createRooms } from "../factories/rooms-factory";

beforeAll(async () => {
  await init();
});
afterAll(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /hotels", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/hotels");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 404 if there is not tickets", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
    it("should respond with status 404 if ticketType IS REMOTE", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createCustomTicketType(true, false);
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
    it("should respond with status 404 if ticketType is not PAID", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
    it("should respond with status 200 with existing hotels", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createCustomTicketType(false, true);
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const hotel = await createHotel();
      await createHotel();

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: hotel.id,
            name: hotel.name,
            image: hotel.image,
            createdAt: hotel.createdAt.toISOString(),
            updatedAt: hotel.updatedAt.toISOString(),
          }),
        ]),
      );
    });
    describe("if param exists", () => {
      it("should respond with status 200 with all existing rooms", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createCustomTicketType(false, true);
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

        const hotel = await createHotel();
        await createRooms(hotel.id);
        const hotelWithRooms = await findHotelWithRooms(hotel.id);

        const response = await server.get(`/hotels/${hotelWithRooms.id}`).set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(httpStatus.OK);
        expect(response.body).toEqual(
          expect.objectContaining({
            id: hotelWithRooms.id,
            name: hotelWithRooms.name,
            image: hotelWithRooms.image,
            createdAt: hotelWithRooms.createdAt.toISOString(),
            updatedAt: hotelWithRooms.updatedAt.toISOString(),
            Rooms: expect.arrayContaining([
              expect.objectContaining({
                id: hotelWithRooms.Rooms[0].id,
                name: hotelWithRooms.Rooms[0].name,
                capacity: hotelWithRooms.Rooms[0].capacity,
                hotelId: hotelWithRooms.Rooms[0].hotelId,
                createdAt: hotelWithRooms.Rooms[0].createdAt.toISOString(),
                updatedAt: hotelWithRooms.Rooms[0].updatedAt.toISOString(),
              }),
            ]),
          }),
        );
      });
    });
  });
});
