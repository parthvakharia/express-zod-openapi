import {
  AnimalType,
  CreateAnimalBodyType,
  UpdateAnimalBodyType,
  GetAnimalByIdRequestParamsType,
  GetAnimalsBySpeciesQueryType,
  AuthRequest,
} from '../types';
import { HandlerContext } from '../../src';

// In-memory animal store for demonstration purposes
const animals = new Map<string, AnimalType>();

// Seed some initial data
animals.set('1', {
  id: '1',
  name: 'Buddy',
  species: 'dog',
  age: 5,
  owner: 'John',
});
animals.set('2', {
  id: '2',
  name: 'Whiskers',
  species: 'cat',
  age: 3,
  owner: 'Sarah',
});
animals.set('3', { id: '3', name: 'Tweety', species: 'bird', age: 2 });

// GET /animals - Get all animals or filter by species
export const getAnimals = ({
  req,
  parsed,
}: HandlerContext<{ query: GetAnimalsBySpeciesQueryType }, AuthRequest>) => {
  const userId = req.user.id; // Example of accessing typed req.user
  const allAnimals = Array.from(animals.values());

  if (parsed.query.species) {
    return allAnimals.filter(
      (animal) => animal.species === parsed.query.species
    );
  }

  return allAnimals;
};

// GET /animals/:id handler
export const getAnimalById = ({
  parsed,
}: HandlerContext<{ params: GetAnimalByIdRequestParamsType }>) => {
  const animal = animals.get(parsed.params.id);
  if (!animal) {
    return { message: 'Animal not found' };
  }
  return animal;
};

// POST /animals handler
export const createAnimal = ({
  parsed,
}: HandlerContext<{ body: CreateAnimalBodyType }>) => {
  const id = String(animals.size + 1);
  const body = parsed.body;
  const newAnimal: AnimalType = {
    id,
    name: body.name,
    species: body.species,
    age: body.age,
    owner: body.owner,
  };
  animals.set(id, newAnimal);
  return newAnimal;
};

// PATCH /animals/:id handler
export const updateAnimal = ({
  parsed,
}: HandlerContext<{
  params: GetAnimalByIdRequestParamsType;
  body: UpdateAnimalBodyType;
}>) => {
  const existing = animals.get(parsed.params.id);
  if (!existing) {
    return { message: 'Animal not found' };
  }
  const body = parsed.body;
  const updated: AnimalType = {
    ...existing,
    name: body.name ?? existing.name,
    species: body.species ?? existing.species,
    age: body.age ?? existing.age,
    owner: body.owner ?? existing.owner,
  };
  animals.set(parsed.params.id, updated);
  return updated;
};

// DELETE /animals/:id handler
export const deleteAnimal = ({
  parsed,
}: HandlerContext<{ params: GetAnimalByIdRequestParamsType }>) => {
  const animal = animals.get(parsed.params.id);
  if (!animal) {
    return { message: 'Animal not found' };
  }
  animals.delete(parsed.params.id);
  return { message: 'Animal deleted successfully', animal };
};
