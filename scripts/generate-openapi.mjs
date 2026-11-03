import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '..');
const routeFile = await readFile(resolve(root, 'packages/types/src/routes.ts'), 'utf8');
const routePatterns = new Map();
for (const [, group, body] of routeFile.matchAll(/^  (\w+): \{([\s\S]*?)^  \},/gm)) {
  for (const [, name, route] of body.matchAll(/^    (\w+): '([^']+)'/gm)) {
    routePatterns.set(`routes.${group}.${name}`, route);
  }
}

const tsconfigPath = resolve(root, 'tsconfig.base.json');
const config = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const endpointFiles = ['public', 'seller', 'admin'].map((name) =>
  resolve(root, `packages/sdk/src/endpoints/${name}.ts`),
);
const program = ts.createProgram({ rootNames: endpointFiles, options: parsed.options });
const checker = program.getTypeChecker();
const endpointFileSet = new Set(endpointFiles.map((file) => resolve(file).toLowerCase()));

const operations = new Map();
for (const sourceFile of program.getSourceFiles()) {
  if (!endpointFileSet.has(resolve(sourceFile.fileName).toLowerCase())) continue;
  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const methodArg = node.arguments[0];
      const routeArg = node.arguments[1];
      const optionsArg = node.arguments[2];
      if (
        node.expression.name.text === 'request' &&
        methodArg &&
        ts.isStringLiteral(methodArg) &&
        routeArg &&
        ts.isPropertyAccessExpression(routeArg)
      ) {
        const routeKey = routeArg.expression.getText(sourceFile) + '.' + routeArg.name.text;
        const route = routePatterns.get(routeKey);
        if (!route) throw new Error(`No shared route pattern found for ${routeKey}`);
        const bodyProperty = findObjectProperty(optionsArg, 'body');
        const queryProperty = findObjectProperty(optionsArg, 'query');
        operations.set(routeKey, {
          method: methodArg.text.toLowerCase(),
          route,
          responseType: node.typeArguments?.[0]
            ? checker.getTypeFromTypeNode(node.typeArguments[0])
            : checker.getVoidType(),
          requestType: bodyProperty ? checker.getTypeAtLocation(bodyProperty) : undefined,
          queryType: queryProperty ? checker.getTypeAtLocation(queryProperty) : undefined,
          sourceFile,
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

function findObjectProperty(node, key) {
  if (!node || !ts.isObjectLiteralExpression(node)) return undefined;
  const property = node.properties.find((item) => {
    if (ts.isPropertyAssignment(item) || ts.isShorthandPropertyAssignment(item)) {
      return (
        (ts.isIdentifier(item.name) && item.name.text === key) ||
        (ts.isStringLiteral(item.name) && item.name.text === key)
      );
    }
    return false;
  });
  if (property && ts.isShorthandPropertyAssignment(property)) return property.name;
  return property && ts.isPropertyAssignment(property) ? property.initializer : undefined;
}

const components = {};
const building = new Set();

function symbolName(type) {
  const symbol = type.aliasSymbol ?? type.getSymbol();
  if (!symbol) return undefined;
  const name = symbol.getName();
  if (
    [
      'Array',
      'ReadonlyArray',
      'Promise',
      'Record',
      'Partial',
      'Pick',
      'Omit',
      'Exclude',
      'Extract',
    ].includes(name)
  )
    return undefined;
  return name === '__type' ? undefined : name;
}

function componentName(type) {
  const alias = type.aliasSymbol;
  const base = (alias ?? type.getSymbol())?.getName();
  if (!base) return undefined;
  const args =
    type.aliasTypeArguments ??
    (type.objectFlags & ts.ObjectFlags.Reference ? checker.getTypeArguments(type) : []);
  const genericText = checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation);
  const genericArgs = genericText.match(new RegExp(`^${base}<(.+)>$`))?.[1];
  const argNames = args?.length
    ? args.map((arg) => symbolName(arg) ?? checker.typeToString(arg).replace(/[^A-Za-z0-9]/g, ''))
    : genericArgs
      ? genericArgs.split(',').map((arg) => arg.trim().replace(/[^A-Za-z0-9]/g, ''))
      : [];
  const suffix = argNames.length ? `_${argNames.join('_')}` : '';
  return `${base}${suffix}`.replace(/[^A-Za-z0-9_]/g, '_');
}

function schemaFor(type, inline = false) {
  if (type.flags & ts.TypeFlags.Any || type.flags & ts.TypeFlags.Unknown)
    return { type: 'object', additionalProperties: true };
  if (
    type.flags & ts.TypeFlags.Never ||
    type.flags & ts.TypeFlags.Void ||
    type.flags & ts.TypeFlags.Undefined
  )
    return { not: {} };
  if (type.flags & ts.TypeFlags.Null) return { type: 'null' };
  if (type.flags & ts.TypeFlags.StringLiteral) return { type: 'string', const: type.value };
  if (type.flags & ts.TypeFlags.NumberLiteral) return { type: 'number', const: type.value };
  if (type.flags & ts.TypeFlags.BooleanLiteral)
    return { type: 'boolean', const: type.intrinsicName === 'true' };
  if (type.flags & ts.TypeFlags.String) return { type: 'string' };
  if (type.flags & ts.TypeFlags.Number) return { type: 'number' };
  if (type.flags & ts.TypeFlags.Boolean) return { type: 'boolean' };

  if (type.isUnion()) {
    const variants = type.types.filter((item) => !(item.flags & ts.TypeFlags.Undefined));
    const schemas = variants.map((item) => schemaFor(item));
    return schemas.length === 1 ? schemas[0] : { oneOf: schemas };
  }
  if (type.isIntersection()) return { allOf: type.types.map((item) => schemaFor(item)) };
  if (checker.isArrayType(type)) {
    const [item] = checker.getTypeArguments(type);
    return { type: 'array', items: schemaFor(item) };
  }
  if (checker.isTupleType(type)) {
    const items = checker.getTypeArguments(type).map((item) => schemaFor(item));
    return { type: 'array', prefixItems: items, minItems: items.length, maxItems: items.length };
  }

  const component = componentName(type);
  const named = symbolName(type);
  if (!inline && component && named && type.flags & ts.TypeFlags.Object) {
    ensureComponent(type, component);
    return { $ref: `#/components/schemas/${component}` };
  }
  return objectSchema(type);
}

function objectSchema(type) {
  const properties = {};
  const required = [];
  const members = checker.getPropertiesOfType(type);
  for (const member of members) {
    const memberType = checker.getTypeOfSymbolAtLocation(
      member,
      member.valueDeclaration ?? member.declarations?.[0],
    );
    properties[member.getName()] = schemaFor(memberType);
    if (!(member.flags & ts.SymbolFlags.Optional)) required.push(member.getName());
  }
  const indexes = checker.getIndexTypeOfType(type, ts.IndexKind.String);
  const schema = { type: 'object', properties };
  if (required.length) schema.required = required;
  if (indexes) schema.additionalProperties = schemaFor(indexes);
  else schema.additionalProperties = false;
  return schema;
}

function ensureComponent(type, name) {
  if (building.has(name) || components[name]) return;
  building.add(name);
  components[name] = objectSchema(type);
  building.delete(name);
}

const paths = {};
const publicOperations = new Set([
  'routes.auth.login',
  'routes.auth.register',
  'routes.auth.refresh',
  'routes.auth.forgotPassword',
  'routes.content.submitBusinessQuote',
]);
const pathParameter = /\{([^}]+)\}/g;
for (const [routeKey, route] of routePatterns) {
  const contract = operations.get(routeKey);
  if (!contract) throw new Error(`No SDK request found for ${routeKey}`);
  const path = `/api/v1${route.replace(/:([A-Za-z]+)/g, '{$1}')}`;
  const operation = {
    operationId: routeKey.replaceAll('.', '_').replace(/^routes_/, ''),
    tags: [routeKey.split('.')[1]],
    summary: `${contract.method.toUpperCase()} ${path}`,
    responses: {},
    security: publicOperations.has(routeKey) ? [] : [{ bearerAuth: [] }],
  };
  const successSchema = schemaFor(contract.responseType);
  operation.responses['200'] = {
    description: 'Successful response',
    ...(successSchema.not ? {} : { content: { 'application/json': { schema: successSchema } } }),
  };
  operation.responses['400'] = {
    description: 'Invalid request',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorBody' } } },
  };
  operation.responses['401'] = {
    description: 'Authentication required or invalid',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorBody' } } },
  };
  operation.responses['403'] = {
    description: 'Insufficient permissions',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorBody' } } },
  };
  const params = [];
  for (const [, name] of path.matchAll(pathParameter)) {
    params.push({ name, in: 'path', required: true, schema: { type: 'string' } });
  }
  if (contract.queryType) {
    for (const member of checker.getPropertiesOfType(contract.queryType)) {
      const memberType = checker.getTypeOfSymbolAtLocation(
        member,
        member.valueDeclaration ?? member.declarations?.[0],
      );
      const openApiSchema = schemaFor(memberType, true);
      params.push({
        name: member.getName(),
        in: 'query',
        required: !(member.flags & ts.SymbolFlags.Optional),
        schema: openApiSchema,
      });
    }
  }
  if (params.length) operation.parameters = params;
  if (contract.requestType) {
    operation.requestBody = {
      required: true,
      content: { 'application/json': { schema: schemaFor(contract.requestType, true) } },
    };
  }
  if (!paths[path]) paths[path] = {};
  paths[path][contract.method] = operation;
}

const document = {
  openapi: '3.1.0',
  info: {
    title: 'MITDRONE Frontend API Contract',
    version: '1.0.0',
    description:
      'Handoff contract generated from shared frontend routes and SDK TypeScript request/response types. This describes frontend expectations; backend implementation and security enforcement belong to the backend team.',
  },
  servers: [{ url: 'http://localhost:4000' }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      ...components,
      ApiErrorBody: {
        type: 'object',
        required: ['code', 'message', 'status'],
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
          status: { type: 'integer' },
          fieldErrors: {
            type: 'object',
            additionalProperties: { type: 'array', items: { type: 'string' } },
          },
        },
        additionalProperties: false,
      },
    },
  },
  paths,
};

await writeFile(resolve(root, 'docs/openapi.yaml'), `${JSON.stringify(document, null, 2)}\n`);
console.log(
  `Generated docs/openapi.yaml (${Object.keys(paths).length} paths, ${Object.keys(components).length} schemas).`,
);
