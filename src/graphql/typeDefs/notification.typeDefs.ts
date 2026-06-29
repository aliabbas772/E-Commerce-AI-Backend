import { gql } from "graphql-tag";

const notificationTypeDefs = gql`
  type Notification {
    _id: ID!
    user: User!
    type: String!
    title: String!
    message: String!
    isRead: Boolean!
    link: String
    createdAt: String!
  }

  type UnreadCount {
    count: Int!
  }

  type Query {
    getMyNotifications(page: Int, limit: Int): [Notification!]!
    getUnreadCount: UnreadCount!
  }

  type Mutation {
    markAsRead(id: ID!): Notification!
    markAllAsRead: MessageResponse!
    deleteNotification(id: ID!): MessageResponse!
  }
`;

export default notificationTypeDefs;
