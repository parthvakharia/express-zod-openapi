# express-ts-zod-openapi

[![npm version](https://img.shields.io/npm/v/express-ts-zod-openapi.svg)](https://www.npmjs.com/package/express-ts-zod-openapi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Type-safe Express APIs with Zod validation and automatic OpenAPI/Swagger generation

Build fully typed Express APIs with automatic request/response validation and OpenAPI documentation generation using [Zod](https://github.com/colinhacks/zod) schemas.

## Features

✅ **Type-Safe Routing** - Full TypeScript inference for request params, query, body, and headers  
✅ **Automatic Validation** - Request validation with detailed Zod error messages  
✅ **Response Validation** - Ensures handlers return correctly typed responses  
✅ **OpenAPI Generation** - Auto-generates OpenAPI 3.0 spec from your Zod schemas  
✅ **Clean API** - Shorthand methods for all HTTP verbs (GET, POST, PUT, PATCH, DELETE)  
✅ **Modular Design** - Singleton pattern for multi-file projects  
✅ **Zero Config** - Works out of the box with Express

## Installation

```bash
npm install express-ts-zod-openapi zod express
```

```bash
# Or with yarn
yarn add express-ts-zod-openapi zod express
```

**Peer Dependencies:**
- `express` ^4.18.0
- `zod` ^3.0.0

### Supported Zod Types

The OpenAPI generator has comprehensive support for Zod types:

| Type | Support | Notes |
|------|---------|-------|
| `z.string()` | ✅ | Including `.email()`, `.url()`, etc. |
| `z.number()` | ✅ | Including `.int()`, `.positive()`, etc. |
| `z.boolean()` | ✅ | |
| `z.array()` | ✅ | |
| `z.object()` | ✅ | With nested objects |
| `z.enum()` | ✅ | |
| `z.nativeEnum()` | ✅ | TypeScript enums |
| `z.union()` | ✅ | Generates `oneOf` |
| `z.literal()` | ✅ | |
| `z.optional()` | ✅ | Marks fields as optional |
| `z.nullable()` | ✅ | Adds `nullable: true` |
| `z.default()` | ✅ | Unwrapped automatically |
| `.describe()` | ✅ | Adds OpenAPI descriptions |
| `z.date()` | ❌ | Planned |
| `z.tuple()` | ❌ | Planned |
| `z.record()` | ❌ | Planned |
| `z.intersection()` | ❌ | Planned |

> For unsupported types, the generator returns an empty schema. You can extend `zodToOpenApiSchema` in `src/openapi.ts` for custom types.

## Quick Start

### 1. Create a router instance

```ts
import { TypedRouter } from 'express-ts-zod-openapi';
import { z } from 'zod';

const router = new TypedRouter();
```

### 2. Define routes with validation

```ts
// Using shorthand methods
router.get('/users/:id', {
  meta: { summary: 'Get a user by ID', tags: ['Users'] },
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: z.object({ id: z.string(), name: z.string() }),
    404: z.object({ message: z.string() }),
  },
  handler: ({ parsed }) => {
    // Your handler logic with type-safe parsed data
    return { id: parsed.params.id, name: 'Alice' };
  },
});

// Also supports: router.post(), router.put(), router.patch(), router.delete()
```

### 3. Register and generate OpenAPI

```ts
import express from 'express';
import { buildOpenApi } from 'express-ts-zod-openapi';

const app = express();
app.use(express.json());

// Register routes
router.register(app);

// Generate OpenAPI spec
const openApi = buildOpenApi(router, {
  title: 'My API',
  version: '1.0.0',
  basePath: '/api',
  description: 'My awesome API',
});

app.get('/swagger.json', (_req, res) => res.json(openApi));
app.listen(3000);
```

## Advanced Usage

### Singleton Router Pattern

For multi-file projects, export a shared router instance:

```ts
// typedRouter.ts
import { TypedRouter } from 'express-ts-zod-openapi';
export const router = new TypedRouter();

// routes/users.ts
import { router } from '../typedRouter';
router.get('/users', { /* ... */ });

// routes/posts.ts
import { router } from '../typedRouter';
router.get('/posts', { /* ... */ });

// server.ts
import { router } from './typedRouter';
import './routes/users';  // Auto-registers routes
import './routes/posts';  // Auto-registers routes
router.register(app);
```

### HandlerContext Type Utility

For cleaner controller functions, use `HandlerContext`:

```ts
import { HandlerContext } from 'express-ts-zod-openapi';

type CreateUserContext = HandlerContext<{
  body: { name: string; email: string };
}>;

export const createUser = ({ req, res, parsed }: CreateUserContext) => {
  const { name, email } = parsed.body;
  // Full access to req, res, and type-safe parsed data
  return { id: '1', name, email };
};

// Use in route
router.post('/users', {
  request: { body: CreateUserBody },
  responses: { 201: User },
  handler: createUser,
});
```

### Custom Request Types (Middleware Support)

Extend `HandlerContext` with custom Request types for middleware-added properties:

```ts
import { Request } from 'express';
import { HandlerContext } from 'express-ts-zod-openapi';

// Define custom Request with middleware properties
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  token?: string;
}

// Use custom Request type in HandlerContext
export const getProfile = ({ req, parsed }: HandlerContext<{}, AuthRequest>) => {
  // req.user is now fully typed!
  const user = req.user;
  
  return {
    id: user?.id,
    email: user?.email,
  };
};

export const updateProfile = ({ req, parsed }: HandlerContext<{
  body: { name: string };
}, AuthRequest>) => {
  // Both parsed.body and req.user are type-safe
  return {
    id: req.user?.id,
    name: parsed.body.name,
  };
};
```

### Named Schemas for OpenAPI

Use `withSchemaName` to create reusable component schemas:

```ts
import { withSchemaName } from 'express-ts-zod-openapi';

const User = withSchemaName(
  z.object({
    id: z.string(),
    name: z.string(),
  }),
  'User'
);
// Will appear as #/components/schemas/User in OpenAPI
```

## Examples

### Complete Working Application

See the [example folder](https://github.com/pvakharia9033/express-ts-zod-openapi/tree/main/example) for a complete application featuring:
- ✅ Modular project structure (routes/controllers/types)
- ✅ Multiple resources (Users & Animals)
- ✅ Full CRUD operations
- ✅ Error handling middleware
- ✅ OpenAPI/Swagger generation

**Run the example:**
```bash
git clone https://github.com/pvakharia9033/express-ts-zod-openapi.git
cd express-ts-zod-openapi/example
npm install
npm start
# VisitDocumentation

### TypedRouter

Main router class for defining type-safe routes.

```ts
import { TypedRouter } from 'express-ts-zod-openapi';

Add error handling middleware to format validation errors:

```ts
import express from 'express';

// After registering routes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.name === 'ZodError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.errors,
    });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});
```

## API Reference

### TypedRouter

```ts
const router = new TypedRouter();

// HTTP method shortcuts
router.get(path, options);
router.post(path, options);
router.put(path, options);
router.patch(path, options);
router.delete(path, options);

// Generic route method
router.route({ method, path, ...options });

// Register routes to Express app
router.register(app);

// Get all registered routes
router.getRoutes();
```

### Route Options

```ts
{
  meta?: {
    summary?: string;
    description?: string;
    tags?: string[];
  },
  request?: {
    params?: ZodSchema;
    query?: ZodSchema;
    body?: ZodSchema;
    headers?: ZodSchema;
  },
  responses: {
    [statusCode: number]: ZodSchema;
  },
  handler: (ctx: { req, res, parsed }) => any;
}
```

### HandlerContext

Utility type for clean, type-safe handler functions.

```ts
type HandlerContext<
  TParsed extends Partial<{
    params: any;
    query: any;
    body: any;
    headers: any;
  }>,
  TRequest extends Request = Request
> = {
  req: TRequest;
  res: Response;
  parsed: TParsed;
};
```

**Generic Parameters:**
- `TParsed` - Parsed request data types (params, query, body, headers)
- `TRequest` - Custom Request type (optional, defaults to Express Request)

**Example:**
```ts
// Basic usage
HandlerContext<{ body: CreateUserType }>

// With custom Request type for middleware
HandlerContext<{ body: CreateUserType }, AuthRequest>
```

## Features

✅ **Request Validation** - Validates params, query, body, and headers with Zod  
✅ **Response Validation** - Ensures handlers return data matching response schemas  
✅ **Type Safety** - Full TypeScript inference for request and response data  
✅ **OpenAPI Generation** - Automatic Swagger/OpenAPI 3.0 spec generation  
✅ **HTTP Methods** - Shorthand methods for all standard HTTP verbs  
✅ **Singleton Pattern** - Share router instance across multiple files  
✅ **Error Handling** - Zod validation errors are properly caught  
✅ **Named Schemas** - Create reusable component schemas with `withSchemaName`

## Project Structure Best Practices

```Why express-ts-zod-openapi?

| Feature | express-ts-zod-openapi | Traditional Express |
|---------|---------------------|---------------------|
| Type Safety | ✅ Full inference | ❌ Manual types |
| Request Validation | ✅ Automatic | ❌ Manual |
| Response Validation | ✅ Automatic | ❌ Manual |
| OpenAPI Docs | ✅ Auto-generated | ❌ Manual |
| Boilerplate | ✅ Minimal | ❌ Extensive |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Issues & Support

- 🐛 [Report bugs](https://github.com/pvakharia9033/express-ts-zod-openapi/issues)
- 💡 [Request features](https://github.com/pvakharia9033/express-ts-zod-openapi/issues)
- 📖 [View documentation](https://github.com/pvakharia9033/express-ts-zod-openapi#readme)

## Roadmap

- [ ] Support for more Zod types (date, tuple, etc.)
- [ ] Enhanced OpenAPI customization
- [ ] Built-in Swagger UI integration
- [ ] Request/response middleware hooks
- [ ] Performance optimizations

## License

MIT © [Parth Vakharia](mailto:pvakharia007@gmail.com)

## Keywords

`express` `zod` `openapi` `swagger` `typescript` `validation` `api` `rest` `type-safe` controllers/
│   ├── users.controller.ts  # User handler functions
│   └── posts.controller.ts  # Post handler functions
└── types/
    ├── users.type.ts     # User Zod schemas & types
    └── posts.type.ts     # Post Zod schemas & types
```



## License

MIT
