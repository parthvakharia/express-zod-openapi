import { router } from '../typedRouter';
import { z } from 'zod';
import {
  Animal,
  CreateAnimalBody,
  UpdateAnimalBody,
  GetAnimalByIdRequestParams,
  GetAnimalsBySpeciesQuery,
} from '../types/animal.type';
import {
  getAnimals,
  getAnimalById,
  createAnimal,
  updateAnimal,
  deleteAnimal,
} from '../controllers/animal.controller';

// GET /animals - Get all animals or filter by species
router.get('/animals', {
  meta: { summary: 'Get all animals or filter by species', tags: ['Animals'] },
  request: {
    query: GetAnimalsBySpeciesQuery,
  },
  responses: {
    200: z.array(Animal),
  },
  handler: getAnimals,
});

// GET /animals/:id
router.get('/animals/:id', {
  meta: { summary: 'Get an animal by ID', tags: ['Animals'] },
  request: {
    params: GetAnimalByIdRequestParams,
  },
  responses: {
    200: Animal,
    404: z.object({ message: z.string() }),
  },
  handler: getAnimalById,
});

// POST /animals
router.post('/animals', {
  meta: { summary: 'Create a new animal', tags: ['Animals'] },
  request: {
    body: CreateAnimalBody,
  },
  responses: {
    201: Animal,
    400: z.object({ message: z.string() }),
  },
  handler: createAnimal,
});

// PATCH /animals/:id
router.patch('/animals/:id', {
  meta: { summary: 'Update an existing animal', tags: ['Animals'] },
  request: {
    params: GetAnimalByIdRequestParams,
    body: UpdateAnimalBody,
  },
  responses: {
    200: Animal,
    404: z.object({ message: z.string() }),
  },
  handler: updateAnimal,
});

// DELETE /animals/:id
router.delete('/animals/:id', {
  meta: { summary: 'Delete an animal', tags: ['Animals'] },
  request: {
    params: GetAnimalByIdRequestParams,
  },
  responses: {
    200: z.object({ message: z.string(), animal: Animal }),
    404: z.object({ message: z.string() }),
  },
  handler: deleteAnimal,
});
