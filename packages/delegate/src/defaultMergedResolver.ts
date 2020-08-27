import { defaultFieldResolver, GraphQLResolveInfo } from 'graphql';

import { getResponseKeyFromInfo, ExecutionResult } from '@graphql-tools/utils';

import { resolveExternalValue } from './resolveExternalValue';
import { getSubschema } from './Subschema';
import { getUnpathedErrors, isExternalObject } from './externalObjects';
import { ExternalObject } from './types';

/**
 * Resolver that knows how to:
 * a) handle aliases for proxied schemas
 * b) handle errors from proxied schemas
 * c) handle external to internal enum coversion
 */
export function defaultMergedResolver(
  parent: ExternalObject,
  args: Record<string, any>,
  context: Record<string, any>,
  info: GraphQLResolveInfo
): any {
  if (!parent) {
    return null;
  }

  const responseKey = getResponseKeyFromInfo(info);

  // check to see if parent is not a proxied result, i.e. if parent resolver was manually overwritten
  // See https://github.com/apollographql/graphql-tools/issues/967
  if (!isExternalObject(parent)) {
    return defaultFieldResolver(parent, args, context, info);
  }

  const data = parent[responseKey];
  const unpathedErrors = getUnpathedErrors(parent);

  // To Do:
  // add support for transforms
  // call out to Receiver abstraction that will publish all patches with channel based on path
  // edit code below to subscribe to appropriate channel based on path
  // so as to handle multiple defer patches and discriminate between them without need for labels

  if (data === undefined && 'ASYNC_ITERABLE' in parent) {
    const asyncIterable = parent['ASYNC_ITERABLE'];
    return asyncIterableToResult(asyncIterable).then(patch => {
      return defaultMergedResolver(patch.data, args, context, info);
    });
  }

  const subschema = getSubschema(parent, responseKey);

  return resolveExternalValue(data, unpathedErrors, subschema, context, info);
}

async function asyncIterableToResult(asyncIterable: AsyncIterable<ExecutionResult>): Promise<any> {
  const asyncIterator = asyncIterable[Symbol.asyncIterator]();
  const payload = await asyncIterator.next();
  return payload.value;
}
