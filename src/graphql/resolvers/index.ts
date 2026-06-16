import lodash from "lodash";
const { merge } = lodash;
import { authResolvers } from "./auth.resolver";
import productResolvers from "./product.resolver";
import orderResolvers from "./order.resolver";
import aiResolvers from "./ai.resolver";
import cartResolvers from "./cart.resolver";
import wishlistResolvers from "./wishlist.resolver";
import categoryResolvers from "./category.resolver";
import addressResolvers from "./address.resolver";
import paymentResolvers from "./payment.resolver";
import reviewResolvers from "./review.resolver";
import adminResolvers from "./admin.resolver";
import notificationResolvers from "./notification.resolver";
import searchResolvers from "./search.resolver";

const resolvers = merge(
  authResolvers,
  productResolvers,
  orderResolvers,
  aiResolvers,
  cartResolvers,
  wishlistResolvers,
  categoryResolvers,
  addressResolvers,
  paymentResolvers,
  reviewResolvers,
  adminResolvers,
  notificationResolvers,
  searchResolvers,
);

export default resolvers;
