import { graphql } from 'graphql/experimental';

import { makeExecutableSchema } from '@graphql-tools/schema';

describe('defer support', () => {
  test('should work', async () => {
    const schema = makeExecutableSchema({
      typeDefs: `
        type Query {
          test(input: String): String
        }
      `,
      resolvers: {
        Query: {
          test: (_root, args) => args.input,
        }
      },
    });

    const result = await graphql(
      schema,
      `
        query {
          ... on Query @defer {
            test(input: "test")
          }
        }
      `,
    );

    const results = [];
    if (result[Symbol.asyncIterator]) {
      for await (let patch of result) {
        results.push(patch);
      }
    }

    expect(results[0]).toEqual({
      data: {},
      hasNext: true,
    });
    expect(results[1]).toEqual({
      data: {
        test: 'test'
      },
      hasNext: false,
      path: [],
    });

  });
});
