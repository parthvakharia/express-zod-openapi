import type { Request, Response, NextFunction, Express, Router } from 'express';
import { z, ZodTypeAny } from 'zod';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface RequestSchemas {
  params?: ZodTypeAny;
  query?: ZodTypeAny;
  body?: ZodTypeAny;
  headers?: ZodTypeAny;
}

export type ResponseSchemas = Record<number, ZodTypeAny>;

export interface RouteMeta {
  summary?: string;
  description?: string;
  tags?: string[];
}

export interface RouteDefinition<
  ReqS extends RequestSchemas = RequestSchemas,
  ResS extends ResponseSchemas = ResponseSchemas,
  TRequest extends Request = Request
> {
  method: HttpMethod;
  path: string;
  request?: ReqS;
  responses: ResS;
  meta?: RouteMeta;
  handler: TypedHandler<ReqS, ResS, TRequest>;
}

export interface ParsedRequest<ReqS extends RequestSchemas = RequestSchemas> {
  params: ReqS['params'] extends ZodTypeAny ? z.infer<ReqS['params']> : unknown;
  query: ReqS['query'] extends ZodTypeAny ? z.infer<ReqS['query']> : unknown;
  body: ReqS['body'] extends ZodTypeAny ? z.infer<ReqS['body']> : unknown;
  headers: ReqS['headers'] extends ZodTypeAny
    ? z.infer<ReqS['headers']>
    : unknown;
}

export type TypedHandler<
  ReqS extends RequestSchemas = RequestSchemas,
  ResS extends ResponseSchemas = ResponseSchemas,
  TRequest extends Request = Request
> = (ctx: {
  req: TRequest;
  res: Response;
  parsed: ParsedRequest<ReqS>;
}) => Promise<unknown> | unknown;

// Utility type for handler context with inferred types
// Supports custom Request types for middleware-added properties
export type HandlerContext<
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

export interface RegisteredRoute<
  ReqS extends RequestSchemas = RequestSchemas,
  ResS extends ResponseSchemas = ResponseSchemas
> extends RouteDefinition<ReqS, ResS, any> {}

export class TypedRouter {
  private routes: RegisteredRoute[] = [];

  route<ReqS extends RequestSchemas, ResS extends ResponseSchemas, TRequest extends Request = Request>(
    def: RouteDefinition<ReqS, ResS, TRequest>
  ): this {
    this.routes.push(def as any);
    return this;
  }

  get<ReqS extends RequestSchemas, ResS extends ResponseSchemas, TRequest extends Request = Request>(
    path: string,
    options: {
      request?: ReqS;
      responses: ResS;
      meta?: RouteMeta;
      handler: TypedHandler<ReqS, ResS, TRequest>;
    }
  ): this {
    return this.route({ method: 'get', path, ...options });
  }

  post<ReqS extends RequestSchemas, ResS extends ResponseSchemas, TRequest extends Request = Request>(
    path: string,
    options: {
      request?: ReqS;
      responses: ResS;
      meta?: RouteMeta;
      handler: TypedHandler<ReqS, ResS, TRequest>;
    }
  ): this {
    return this.route({ method: 'post', path, ...options });
  }

  put<ReqS extends RequestSchemas, ResS extends ResponseSchemas, TRequest extends Request = Request>(
    path: string,
    options: {
      request?: ReqS;
      responses: ResS;
      meta?: RouteMeta;
      handler: TypedHandler<ReqS, ResS, TRequest>;
    }
  ): this {
    return this.route({ method: 'put', path, ...options });
  }

  patch<ReqS extends RequestSchemas, ResS extends ResponseSchemas, TRequest extends Request = Request>(
    path: string,
    options: {
      request?: ReqS;
      responses: ResS;
      meta?: RouteMeta;
      handler: TypedHandler<ReqS, ResS, TRequest>;
    }
  ): this {
    return this.route({ method: 'patch', path, ...options });
  }

  delete<ReqS extends RequestSchemas, ResS extends ResponseSchemas, TRequest extends Request = Request>(
    path: string,
    options: {
      request?: ReqS;
      responses: ResS;
      meta?: RouteMeta;
      handler: TypedHandler<ReqS, ResS, TRequest>;
    }
  ): this {
    return this.route({ method: 'delete', path, ...options });
  }

  register(appOrRouter: Express | Router): void {
    for (const route of this.routes) {
      const { method, path, request, responses, handler } = route;

      const wrapped = async (
        req: Request,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const parsed: ParsedRequest = {
            params: request?.params
              ? request.params.parse(req.params)
              : req.params,
            query: request?.query ? request.query.parse(req.query) : req.query,
            body: request?.body ? request.body.parse(req.body) : req.body,
            headers: request?.headers
              ? request.headers.parse(req.headers)
              : req.headers,
          } as ParsedRequest;

          const result = await handler({ req, res, parsed });

          // Validate response against first 2xx schema if available
          const status =
            res.statusCode && res.statusCode >= 200 && res.statusCode < 300
              ? res.statusCode
              : 200;

          const schema =
            responses[status] ?? first2xxSchema(responses) ?? responses[200];

          if (schema) {
            const parsedResult = schema.parse(result);
            res.status(status).json(parsedResult);
          } else if (result !== undefined) {
            res.status(status).json(result);
          } else {
            next();
          }
        } catch (err) {
          next(err);
        }
      };

      (appOrRouter as any)[method](path, wrapped);
    }
  }

  getRoutes(): RegisteredRoute[] {
    return [...this.routes];
  }
}

function first2xxSchema(responses: ResponseSchemas): ZodTypeAny | undefined {
  const statusCodes = Object.keys(responses)
    .map((s) => Number(s))
    .filter((n) => !Number.isNaN(n) && n >= 200 && n < 300)
    .sort((a, b) => a - b);

  const first = statusCodes[0];
  if (first !== undefined) {
    return responses[first];
  }
  return undefined;
}
