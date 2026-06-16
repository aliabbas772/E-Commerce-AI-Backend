import transporter from "../config/mailer";

export const sendWelcomeEmail = async (
  email: string,
  name: string,
): Promise<void> => {
  await transporter.sendMail({
    from: `"EcommerceAI" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Welcome to EcommerceAI! 🎉",
    html: `
      <h2>Welcome ${name}!</h2>
      <p>Your account has been created successfully.</p>
      <p>Start shopping now!</p>
    `,
  });
};

export const sendOrderConfirmationEmail = async (
  email: string,
  name: string,
  orderId: string,
  totalAmount: number,
): Promise<void> => {
  await transporter.sendMail({
    from: `"EcommerceAI" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Order Confirmed ✅",
    html: `
      <h2>Hi ${name}, your order is confirmed!</h2>
      <p>Order ID: <strong>${orderId}</strong></p>
      <p>Total Amount: <strong>₹${totalAmount}</strong></p>
      <p>We'll notify you when it ships.</p>
    `,
  });
};

export const sendPaymentSuccessEmail = async (
  email: string,
  name: string,
  orderId: string,
  totalAmount: number,
): Promise<void> => {
  await transporter.sendMail({
    from: `"EcommerceAI" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Payment Successful 💰",
    html: `
      <h2>Hi ${name}, payment received!</h2>
      <p>Order ID: <strong>${orderId}</strong></p>
      <p>Amount Paid: <strong>₹${totalAmount}</strong></p>
      <p>Your order is now being processed.</p>
    `,
  });
};

export const sendShippingEmail = async (
  email: string,
  name: string,
  orderId: string,
): Promise<void> => {
  await transporter.sendMail({
    from: `"EcommerceAI" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Your Order Has Shipped 🚚",
    html: `
      <h2>Hi ${name}, your order is on the way!</h2>
      <p>Order ID: <strong>${orderId}</strong></p>
      <p>Expected delivery in 3-5 business days.</p>
    `,
  });
};

export const sendOTPEmail = async (
  email: string,
  otp: string,
): Promise<void> => {
  await transporter.sendMail({
    from: `"EcommerceAI" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Your OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto;">
        <h2>Your OTP Code</h2>
        <p>Use the code below to verify your identity:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #333; padding: 20px; background: #f5f5f5; text-align: center; border-radius: 8px;">
          ${otp}
        </div>
        <p style="color: #999; margin-top: 16px;">This code expires in <strong>5 minutes.</strong></p>
        <p style="color: #999;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};
