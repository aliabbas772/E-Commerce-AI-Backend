import { GraphQLError } from 'graphql'
import { Context } from '../../types/context.types'
import {
  getMyAddressesService,
  getAddressByIdService,
  createAddressService,
  updateAddressService,
  deleteAddressService,
  setDefaultAddressService
} from '../../services/address.service'

const requireAuth = (context: Context) => {
  if (!context.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } })
}

const addressResolvers = {
  Query: {
    getMyAddresses: (_: unknown, __: unknown, context: Context) => {
      requireAuth(context)
      return getMyAddressesService(context.user!._id.toString())
    },
    getAddressById: (_: unknown, args: { id: string }, context: Context) => {
      requireAuth(context)
      return getAddressByIdService(args.id, context.user!._id.toString())
    }
  },
  Mutation: {
    createAddress: (_: unknown, args: { input: any }, context: Context) => {
      requireAuth(context)
      return createAddressService(context.user!._id.toString(), args.input)
    },
    updateAddress: (_: unknown, args: { id: string; input: any }, context: Context) => {
      requireAuth(context)
      return updateAddressService(args.id, context.user!._id.toString(), args.input)
    },
    deleteAddress: (_: unknown, args: { id: string }, context: Context) => {
      requireAuth(context)
      return deleteAddressService(args.id, context.user!._id.toString())
    },
    setDefaultAddress: (_: unknown, args: { id: string }, context: Context) => {
      requireAuth(context)
      return setDefaultAddressService(args.id, context.user!._id.toString())
    }
  }
}

export default addressResolvers