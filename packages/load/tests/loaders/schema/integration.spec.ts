import { loadSchema, loadSchemaSync } from '@graphql-tools/load';
import { CodeFileLoader } from '@graphql-tools/code-file-loader';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { printSchema } from 'graphql';
import { runTests, useMonorepo } from '../../../../testing/utils';
import '../../../../testing/to-be-similar-gql-doc';

const monorepo = useMonorepo({
  dirname: __dirname,
});

describe('loadSchema', () => {
  monorepo.correctCWD();

  runTests({
    async: loadSchema,
    sync: loadSchemaSync
  })(load => {
    test('should throw when all files are invalid and unable to load it', async () => {
      const schemaPath = './tests/loaders/schema/test-files/error.ts';
      try {
        await load(schemaPath, {
          loaders: [new CodeFileLoader()]
        });
        expect(true).toBeFalsy(); // should throw
      } catch (e) {
        expect(e.toString()).toContain(`SyntaxError`);
      }
    });

    test('should work with ts files and without globs correctly', async () => {
      const schemaPath = './tests/loaders/schema/test-files/schema-dir/type-defs/graphql-tag.ts';
      const schema = await load(schemaPath, {
        loaders: [new CodeFileLoader()]
      });
      expect(schema.getTypeMap().User).toBeDefined();
      expect(schema.getTypeMap().Query).toBeDefined();
    });

    test('should work with graphql single file', async () => {
      const schemaPath = './tests/loaders/schema/test-files/schema-dir/user.graphql';
      const schema = await load(schemaPath, {
        loaders: [new GraphQLFileLoader()]
      });

      expect(schema.getTypeMap().User).toBeDefined();
    });

    test('import and merge Query types from few different files', async () => {
      const schema = await load('../import/tests/schema/fixtures/multiple-root/*/schema.graphql', {
        loaders: [new GraphQLFileLoader()]
      });
      const schemaStr = printSchema(schema);

      expect(schemaStr).toBeSimilarGqlDoc(/* GraphQL */`
        """
        Directs the executor to defer this fragment when the \`if\` argument is true or undefined.
        """
        directive @defer(
          """Deferred when true or undefined."""
          if: Boolean

          """Unique name"""
          label: String
        ) on FRAGMENT_SPREAD | INLINE_FRAGMENT

        """
        Directs the executor to stream plural fields when the \`if\` argument is true or undefined.
        """
        directive @stream(
          """Stream when true or undefined."""
          if: Boolean

          """Unique name"""
          label: String

          """Number of items to return immediately"""
          initialCount: Int!
        ) on FIELD

        type Query {
          a: A
          b: B
          c: C
        }

        type A {
          text: String
        }

        type B {
          text: String
        }

        type C {
          text: String
        }
      `);
    });
})
});
