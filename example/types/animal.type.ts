import { z } from 'zod';
import { withSchemaName } from '../../src';

export const AnimalSpecies = z
  .enum(['dog', 'cat', 'bird', 'fish', 'rabbit'])
  .describe('Animal species');

export const Animal = withSchemaName(
  z.object({
    id: z.string().describe('Animal identifier'),
    name: z.string().describe('Animal name'),
    species: AnimalSpecies,
    age: z.number().int().positive().describe('Age in years'),
    owner: z.string().optional().describe('Owner name'),
  }),
  'Animal'
);

export const CreateAnimalBody = z.object({
  name: z.string(),
  species: AnimalSpecies,
  age: z.number().int().positive(),
  owner: z.string().optional(),
});

export const UpdateAnimalBody = z.object({
  name: z.string().optional(),
  species: AnimalSpecies.optional(),
  age: z.number().int().positive().optional(),
  owner: z.string().optional().nullable(),
});

export const GetAnimalByIdRequestParams = z.object({ id: z.string() });

export const GetAnimalsBySpeciesQuery = z.object({
  species: AnimalSpecies.optional(),
});

export type AnimalType = z.infer<typeof Animal>;
export type CreateAnimalBodyType = z.infer<typeof CreateAnimalBody>;
export type UpdateAnimalBodyType = z.infer<typeof UpdateAnimalBody>;
export type GetAnimalByIdRequestParamsType = z.infer<typeof GetAnimalByIdRequestParams>;
export type GetAnimalsBySpeciesQueryType = z.infer<typeof GetAnimalsBySpeciesQuery>;
