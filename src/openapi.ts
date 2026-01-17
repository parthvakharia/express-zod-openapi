import { ZodObject, ZodRawShape, ZodTypeAny } from 'zod';
import type { RequestSchemas } from './router';
import { TypedRouter } from './router';

// ---- Minimal OpenAPI/Swagger generation ----

export interface OpenApiOptions {
  title: string;
  version: string;
  basePath?: string;
  description?: string;
}

export interface OpenApiDocument {
  openapi: '3.0.0';
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, any>;
  components?: {
    schemas: Record<string, any>;
  };
}

interface OpenApiSchemaContext {
  components: {
    schemas: Record<string, any>;
  };
}

// Attach minimal OpenAPI metadata to a Zod schema, e.g. a reusable name
export function withSchemaName<T extends ZodTypeAny>(schema: T, name: string): T {
  const target: any = schema;
  target._openApi = {
    ...(target._openApi ?? {}),
    name,
  };
  return schema;
}

// Convert Express-style paths (/users/:id) to OpenAPI-style (/users/{id})
function expressPathToOpenApiPath(path: string): string {
  return path.replace(/:([^/]+)/g, '{$1}');
}

export function buildOpenApi(typedRouter: TypedRouter, options: OpenApiOptions): OpenApiDocument {
  const paths: Record<string, any> = {};
  const components: { schemas: Record<string, any> } = { schemas: {} };

  const schemaContext: OpenApiSchemaContext = {
    components,
  };

  for (const route of typedRouter.getRoutes()) {
    const expressPath = options.basePath ? `${options.basePath}${route.path}` : route.path;
    const path = expressPathToOpenApiPath(expressPath);
    const method = route.method;

    if (!paths[path]) paths[path] = {};

    const bodySchema = route.request?.body;
    const requestBody = bodySchema
      ? {
          required: true,
          content: {
            'application/json': {
              schema: zodToOpenApiSchema(bodySchema, schemaContext),
            },
          },
        }
      : undefined;

    const parameters = buildParameters(route.request);

    const responses: Record<string, any> = {};
    for (const [status, schema] of Object.entries(route.responses)) {
      responses[String(status)] = {
        description: 'Response',
        content: {
          'application/json': {
            schema: zodToOpenApiSchema(schema, schemaContext),
          },
        },
      };
    }

    (paths[path] as any)[method] = {
      summary: route.meta?.summary,
      description: route.meta?.description,
      tags: route.meta?.tags,
      requestBody,
      parameters,
      responses,
    };
  }

  const doc: OpenApiDocument = {
    openapi: '3.0.0',
    info: {
      title: options.title,
      version: options.version,
      description: options.description,
    },
    paths,
  };

  if (Object.keys(components.schemas).length) {
    doc.components = components;
  }

  return doc;
}

function buildParameters(req?: RequestSchemas) {
  const params: any[] = [];

  if (req?.params && req.params instanceof ZodObject) {
    const shape = (req.params as ZodObject<ZodRawShape>).shape;
    for (const [name, schema] of Object.entries(shape)) {
      params.push({
        name,
        in: 'path',
        required: true,
        schema: zodToOpenApiSchema(schema as ZodTypeAny),
      });
    }
  }

  if (req?.query && req.query instanceof ZodObject) {
    const shape = (req.query as ZodObject<ZodRawShape>).shape;
    for (const [name, schema] of Object.entries(shape)) {
      params.push({
        name,
        in: 'query',
        required: false,
        schema: zodToOpenApiSchema(schema as ZodTypeAny),
      });
    }
  }

  if (req?.headers && req.headers instanceof ZodObject) {
    const shape = (req.headers as ZodObject<ZodRawShape>).shape;
    for (const [name, schema] of Object.entries(shape)) {
      params.push({
        name,
        in: 'header',
        required: false,
        schema: zodToOpenApiSchema(schema as ZodTypeAny),
      });
    }
  }

  return params.length ? params : undefined;
}

// Helper to unwrap wrappers like optional/nullable/default/effects
function unwrapZodType(schema: ZodTypeAny): {
  schema: ZodTypeAny;
  isNullable: boolean;
  isOptional: boolean;
  description?: string;
  openApiName?: string;
} {
  let current: any = schema;
  let isNullable = false;
  let isOptional = false;
  let description: string | undefined = current?._def?.description;
  let openApiName: string | undefined = (current as any)._openApi?.name;

  while (current?._def?.typeName) {
    switch (current._def.typeName) {
      case 'ZodOptional':
        isOptional = true;
        current = current._def.innerType;
        if (!description) description = current?._def?.description;
        if (!openApiName) openApiName = (current as any)._openApi?.name;
        continue;
      case 'ZodNullable':
        isNullable = true;
        current = current._def.innerType;
        if (!description) description = current?._def?.description;
        if (!openApiName) openApiName = (current as any)._openApi?.name;
        continue;
      case 'ZodDefault':
        current = current._def.innerType;
        if (!description) description = current?._def?.description;
        if (!openApiName) openApiName = (current as any)._openApi?.name;
        continue;
      case 'ZodEffects':
        current = current._def.schema;
        if (!description) description = current?._def?.description;
        if (!openApiName) openApiName = (current as any)._openApi?.name;
        continue;
      default:
        return { schema: current as ZodTypeAny, isNullable, isOptional, description, openApiName };
    }
  }

  return { schema: current as ZodTypeAny, isNullable, isOptional, description, openApiName };
}

// Enhanced subset of Zod -> OpenAPI schema conversion
export function zodToOpenApiSchema(
  schema: ZodTypeAny,
  context?: OpenApiSchemaContext,
  opts?: { asComponent?: boolean },
): any {
  const unwrapped = unwrapZodType(schema);
  const baseSchema = unwrapped.schema;
  const isNullable = unwrapped.isNullable;
  const description = unwrapped.description;
  const rawName = unwrapped.openApiName;
  const effectiveName = rawName;
  const def: any = (baseSchema as any)._def;

  let result: any;

  // If this schema has a name (explicit or auto) and we have a context, register as component and use $ref
  if (context && effectiveName && !opts?.asComponent) {
    if (!context.components.schemas[effectiveName]) {
      context.components.schemas[effectiveName] = zodToOpenApiSchema(schema, context, {
        asComponent: true,
      });
    }
    const ref: any = { $ref: `#/components/schemas/${effectiveName}` };
    if (description) {
      ref.description = description;
    }
    if (isNullable) {
      ref.nullable = true;
    }
    return ref;
  }

  switch (def?.typeName) {
    case 'ZodString':
      result = { type: 'string' };
      break;
    case 'ZodNumber':
      result = { type: 'number' };
      break;
    case 'ZodBoolean':
      result = { type: 'boolean' };
      break;
    case 'ZodArray':
      result = {
        type: 'array',
        items: zodToOpenApiSchema(def.type, context),
      };
      break;
    case 'ZodObject': {
      const shape = def.shape();
      const properties: Record<string, any> = {};
      const required: string[] = [];
      for (const [key, value] of Object.entries<ZodTypeAny>(shape)) {
        const unwrappedProp = unwrapZodType(value);
        const propSchema = zodToOpenApiSchema(unwrappedProp.schema, context);
        if (unwrappedProp.description) {
          propSchema.description = unwrappedProp.description;
        }
        if (unwrappedProp.isNullable) {
          propSchema.nullable = true;
        }
        properties[key] = propSchema;
        if (!unwrappedProp.isOptional) {
          required.push(key);
        }
      }
      result = {
        type: 'object',
        properties,
        ...(required.length ? { required } : {}),
      };
      break;
    }
    case 'ZodUnion': {
      const options = def.options as ZodTypeAny[];
      result = {
        oneOf: options.map((o) => zodToOpenApiSchema(o, context)),
      };
      break;
    }
    case 'ZodLiteral': {
      result = { enum: [def.value] };
      break;
    }
    case 'ZodEnum': {
      const values = def.values as string[];
      result = {
        type: 'string',
        enum: values,
      };
      break;
    }
    case 'ZodNativeEnum': {
      const rawValues = Object.values(def.values ?? {});
      const enumValues = rawValues.filter((v) => typeof v === 'string' || typeof v === 'number');
      const first = enumValues[0];
      const type = typeof first === 'number' ? 'number' : 'string';
      result = {
        type,
        enum: enumValues,
      };
      break;
    }
    default:
      result = {};
  }

  if (description) {
    result.description = description;
  }
  if (isNullable) {
    result.nullable = true;
  }

  return result;
}
