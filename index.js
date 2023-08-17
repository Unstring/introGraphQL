const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
app.use(cors());

const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const schema = buildSchema(`
  type User {
    id: Int!
    name: String!
    email: String!
  }
  type Query {
    getUser(id: Int!): User
    getUsers: [User]
    getUserByName(name: String!): User
  }
  type Mutation {
    createUser(name: String!, email: String!): User
    updateUser(id: Int!, name: String!, email: String!): User
    deleteUser(id: Int!): Boolean
  }
`);
const root = {
  getUser: ({ id }) => db.users.find((user) => user.id === id),
  getUsers: () => db.users,
  createUser: ({ name, email }) => {
    const newUser = {
      id: db.users.length + 1,
      name,
      email,
    };
    db.users.push(newUser);
    fs.writeFileSync(dbPath, JSON.stringify(db), 'utf8');
    return newUser;
  },
  updateUser: ({ id, name, email }) => {
    const userIndex = db.users.findIndex((user) => user.id === id);
    if (userIndex !== -1) {
      db.users[userIndex].name = name;
      db.users[userIndex].email = email;
      fs.writeFileSync(dbPath, JSON.stringify(db), 'utf8');
      return db.users[userIndex];
    }
    return null;
  },
  deleteUser: ({ id }) => {
    const userIndex = db.users.findIndex((user) => user.id === id);
    if (userIndex !== -1) {
      db.users.splice(userIndex, 1);
      fs.writeFileSync(dbPath, JSON.stringify(db), 'utf8');
      return true;
    }
    return false;
  },
  getUserByName: ({ name }) =>
    db.users.find((user) =>
      user.name.toLowerCase().includes(name.toLowerCase())
    ),
};
app.use(
  '/graphql',
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
);
app.get('/', (req, res) => {
  const options = {
    root: path.join(__dirname),
  };
  const fileName = 'home.html';
  res.sendFile(fileName, options, function (err) {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});