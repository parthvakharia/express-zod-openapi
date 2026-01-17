import express from 'express';
import { buildOpenApi, withSchemaName } from '../src';
import { router } from './typedRouter';
import { authMiddleware } from './middleware/auth.middleware';
import './routes'; // Auto-loads all routes

const app = express();
app.use(express.json());

// Apply auth middleware to protected routes
app.use(authMiddleware);

// Register routes
router.register(app);

// Global error handler for validation errors
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

// Generate Swagger/OpenAPI JSON
const openApi = buildOpenApi(router, {
  title: 'Example API',
  version: '1.0.0',
  basePath: '/api',
  description: 'API with Users and Animals resources',
});

app.get('/swagger.json', (_req, res) => {
  res.json(openApi);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Example server listening on http://localhost:${port}`);
  console.log(
    `Swagger JSON available at http://localhost:${port}/swagger.json`
  );
});
