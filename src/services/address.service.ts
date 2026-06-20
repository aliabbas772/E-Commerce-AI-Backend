import { GraphQLError } from "graphql";
import { Address } from "../models/Address.model";

const MAX_ADDRESSES = 5; // limit per user — like Amazon

export const getMyAddressesService = async (userId: string) => {
  return Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
};

export const getAddressByIdService = async (id: string, userId: string) => {
  const address = await Address.findById(id);
  if (!address) {
    throw new GraphQLError("Address not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }
  // User can only access their own address
  if (address.user.toString() !== userId) {
    throw new GraphQLError("Not authorized", {
      extensions: { code: "FORBIDDEN" },
    });
  }
  return address;
};

export const createAddressService = async (
  userId: string,
  input: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
    label?: "home" | "office" | "other";
  },
) => {
  const count = await Address.countDocuments({ user: userId });
  if (count >= MAX_ADDRESSES) {
    throw new GraphQLError(
      `Maximum ${MAX_ADDRESSES} addresses allowed. Delete one to add more.`,
      { extensions: { code: "BAD_USER_INPUT" } },
    );
  }

  // If first address, make it default automatically
  const isFirst = count === 0;

  const address = await Address.create({
    user: userId,
    ...input,
    isDefault: isFirst,
  });

  return address;
};

export const updateAddressService = async (
  id: string,
  userId: string,
  input: Partial<{
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    label?: "home" | "office" | "other";
  }>,
) => {
  const address = await Address.findById(id);
  if (!address) {
    throw new GraphQLError("Address not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }
  if (address.user.toString() !== userId) {
    throw new GraphQLError("Not authorized", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  Object.assign(address, input);
  await address.save();
  return address;
};

export const deleteAddressService = async (id: string, userId: string) => {
  const address = await Address.findById(id);
  if (!address) {
    throw new GraphQLError("Address not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }
  if (address.user.toString() !== userId) {
    throw new GraphQLError("Not authorized", {
      extensions: { code: "FORBIDDEN" },
    });
  }
  if (address.isDefault) {
    throw new GraphQLError(
      "Cannot delete default address. Set another as default first.",
      { extensions: { code: "BAD_USER_INPUT" } },
    );
  }

  await Address.findByIdAndDelete(id);
  return { message: "Address deleted successfully" };
};

export const setDefaultAddressService = async (id: string, userId: string) => {
  const address = await Address.findById(id);
  if (!address) {
    throw new GraphQLError("Address not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }
  if (address.user.toString() !== userId) {
    throw new GraphQLError("Not authorized", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  await Address.updateMany(
    { user: userId, _id: { $ne: id } },
    { isDefault: false },
  );

  address.isDefault = true;
  await address.save();
  return address;
};
