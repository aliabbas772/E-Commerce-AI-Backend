import { producer } from "../../config/kafka";

export const publishOrderCreated = async (data: {
  orderId: string;
  userId: string;
  email: string;
  name: string;
  totalAmount: number;
}): Promise<void> => {
  await producer.send({
    topic: "order.created",
    messages: [
      {
        key: data.orderId,
        value: JSON.stringify(data),
      },
    ],
  });
};

export const publishPaymentVerified = async (data: {
  orderId: string;
  email: string;
  name: string;
  totalAmount: number;
}): Promise<void> => {
  await producer.send({
    topic: "payment.verified",
    messages: [
      {
        key: data.orderId,
        value: JSON.stringify(data),
      },
    ],
  });
};

export const publishOrderShipped = async (data: {
  orderId: string;
  email: string;
  name: string;
}): Promise<void> => {
  await producer.send({
    topic: "order.shipped",
    messages: [
      {
        key: data.orderId,
        value: JSON.stringify(data),
      },
    ],
  });
};

export const publishWelcomeEmail = async (data: {
  email: string;
  name: string;
}): Promise<void> => {
  await producer.send({
    topic: "welcome.email",
    messages: [
      {
        key: data.email,
        value: JSON.stringify(data),
      },
    ],
  });
};
