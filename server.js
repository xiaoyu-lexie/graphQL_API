const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLSkipDirective,
} = require("graphql");

const authors = [
  { id: 1, name: "first author name" },
  { id: 2, name: "second author name" },
  { id: 3, name: "third author name" },
  { id: 4, name: "fourth author name" },
];

const books = [
  { id: 1, name: "first book name", authorId: 1 },
  { id: 2, name: "second book name", authorId: 1 },
  { id: 3, name: "3rd book name", authorId: 1 },
  { id: 4, name: "4th book name", authorId: 2 },
  { id: 5, name: "5th book name", authorId: 2 },
  { id: 6, name: "6th book name", authorId: 2 },
  { id: 7, name: "7th book name", authorId: 3 },
  { id: 8, name: "8th book name", authorId: 3 },
];

const app = express();

const BookType = new GraphQLObjectType({
  name: "Book",
  description: "This represents a book",
  // 关于为什么fields是一个return an object的function，而不直接是an object，是因为55行的AuthorType定义的比较晚，如果是obejct的话，会返回错误说AuthorType is not defined，但function就不会有这个问题。
  fields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLInt),
      //这里不需要resolve的原因是，book的每一个element本来就有id，下面的name和authorId同理。
    },
    name: { type: GraphQLNonNull(GraphQLString) },
    authorId: { type: GraphQLNonNull(GraphQLInt) },
    // 下面的设置是让authors和books交互起来，因为一本书只对应一个作者，所以type直接是AuthorType，而不是new GraphQLList(AuthorType)
    author: {
      type: AuthorType,
      //这里的book argument对应的是parent,意思是author在BookType里,所以parent为book
      resolve: (book) => {
        return authors.find((author) => author.id === book.authorId);
      },
    },
  }),
});

const AuthorType = new GraphQLObjectType({
  name: "Author",
  description: "This represents a author",
  fields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLInt),
    },
    name: { type: GraphQLNonNull(GraphQLString) },
    // 同45行，下面的设置是让authors和books交互起来，因为一个作者可以对应好几本书，所以type是new GraphQLList(BookType)， 而不是BookType
    books: {
      type: new GraphQLList(BookType),
      //同48行，author也是parent
      resolve: (author) => {
        return books.filter((book) => book.authorId === author.id);
      },
    },
  }),
});

const RootQueryType = new GraphQLObjectType({
  name: "Query",
  description: "Root Query",
  fields: () => ({
    // 添加第1个: books
    books: {
      type: new GraphQLList(BookType),
      description: "List of Books",
      resolve: () => books,
    },
    //添加第2个：authors，这个和books为相互独立的
    authors: {
      type: new GraphQLList(AuthorType),
      description: "List of Authors",
      resolve: () => authors,
    },
    // 添加底3个：book，只返回符合条件的一本书。resolve function需要第2个parameter: args
    book: {
      type: BookType,
      description: "A Single Book",
      args: {
        id: { type: GraphQLInt },
      },
      resolve: (parent, args) => books.find((book) => book.id === args.id),
    },
    // 添加第4个; author，和3非常相似
    author: {
      type: AuthorType,
      description: "A Single Author",
      args: {
        id: { type: GraphQLInt },
      },
      resolve: (parent, args) =>
        authors.find((author) => author.id === args.id),
    },
  }),
});

const RootMutationType = new GraphQLObjectType({
  name: "Mutation",
  description: "Root Mutation",
  fields: () => ({
    addBook: {
      type: BookType,
      description: "add a book",
      args: {
        name: { type: GraphQLNonNull(GraphQLString) }, //string 必须要用double quotes
        authorId: { type: GraphQLNonNull(GraphQLInt) },
      },
      resolve: (parent, args) => {
        const book = {
          id: books.length + 1,
          name: args.name,
          authorId: args.authorId,
        };
        books.push(book);
        return book;
      },
    },
    //addAuthor同理
  }),
});

const schema = new GraphQLSchema({
  query: RootQueryType,
  mutation: RootMutationType,
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    graphiql: true,
  })
);

app.listen(8000, () => console.log("Server running"));
