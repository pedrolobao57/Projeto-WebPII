import {faker}from "@faker-js/faker"; 

const ALLOWED_BRANDS = ['Toyota', 'Volkswagen', 'BMW', 'Mercedes', 'Audi', 'Ford', 'Renault', 'Peugeot', 'Tesla', 'Fiat'];

export const generateFakeUser = () => {
    return{
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'password123', // Password padrão para testes
        avatar: faker.image.avatar(),
        id_number: faker.string.numeric(10),
        // Um utilizador agora tem vários veículos associados
        vehicles: [
            {
                plate: faker.vehicle.plate(),
                brand: faker.helpers.arrayElement(['Toyota', 'BMW', 'Tesla'])
            },
            {
                plate: faker.vehicle.plate(),
                brand: faker.helpers.arrayElement(['Audi', 'Ford'])
            }
        ]
    }
}