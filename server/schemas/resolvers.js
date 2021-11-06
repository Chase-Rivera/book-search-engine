const { AuthenticationError } = require("apollo-server-express");
const { User, Book } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                return User.findOne({ _id: context.user._id }).populate('savedBooks');
            }
            throw new AuthenticationError('You need to be logged in!');
        },
    },
    Mutation: {
        addUser: async (parent, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user);
            return { token, user };
        },

        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('No user found with this email address');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user);

            return { token, user };
        },

        saveBook: async (parent, { BookInput }, context) => {
            if (context.user) {
                const savedBooks = await Book.create({
                    ...BookInput
                });

                await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: savedBooks.bookId } }
                );

                return savedBooks;
            }
            throw new AuthenticationError('You need to be logged in!');
        },

        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
              const rmvBook = await Book.findOneAndDelete({
                _id: bookId,
              });
      
              await User.findOneAndUpdate(
                { _id: context.user._id },
                { $pull: { thoughts: rmvBook.bookId } }
              );
      
              return rmvBook;
            }
            throw new AuthenticationError('You need to be logged in!');
          },

    },
};

module.exports = resolvers;