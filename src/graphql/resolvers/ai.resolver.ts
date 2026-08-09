import { GraphQLError } from 'graphql'
import redis from "../../config/redis";
import { Context } from '../../types/context.types'
import {
  askSupportChatService,
  getOutfitRecommendationService,
  getSizeRecommendationService
} from '../../services/ai.service'

const requireAuth = (context: Context) => {
  if (!context.user) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' }
    })
  }
}

const aiResolvers = {
  Query: {
    getOutfitRecommendation: async (
      _: unknown,
      args: { occasion: string; budget: number; gender: string },
      context: Context
    ) => {
      requireAuth(context)
      return getOutfitRecommendationService(args, context.user!._id.toString())
    },

    getSizeRecommendation: async (
      _: unknown,
      args: { height: number; weight: number; gender: string; category: string },
      context: Context
    ) => {
      requireAuth(context)
      return getSizeRecommendationService(args, context.user!._id.toString())
    },

    askSupportChat: async (_: unknown, args: { query: string }, context: Context) => {
    requireAuth(context);
    return askSupportChatService(args.query, context.user!._id.toString());
},
  }
}

export default aiResolvers