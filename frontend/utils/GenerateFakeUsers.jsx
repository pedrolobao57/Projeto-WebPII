import { faker } from "@faker-js/faker";
import brands from "../src/api/brands";

const ALLOWED_BRANDS = brands;

export const generateFakeUser = () => {
    return {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'password123', // Password padrão para testes
        avatar: faker.image.avatar(),
        id_number: faker.string.numeric(10),
        // Um utilizador agora tem vários veículos associados
        vehicles: [
            {
                plate: faker.vehicle.vrm(),
                brand: faker.helpers.arrayElement(ALLOWED_BRANDS),
                model: faker.vehicle.model(),
                color: faker.vehicle.color()
            }
        ]
    };
}