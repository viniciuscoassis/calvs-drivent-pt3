import { prisma } from "@/config";
import faker from "@faker-js/faker";

export async function createRooms(hotelId: number) {
  return prisma.room.createMany({
    data: {
      name: faker.name.findName(),
      capacity: faker.datatype.number(),
      hotelId
    }
  });
}
