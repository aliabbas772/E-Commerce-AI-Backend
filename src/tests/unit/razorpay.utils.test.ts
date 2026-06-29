import { verifyRazorpaySignature } from '../../utils/razorpay.utils'
import crypto from 'crypto'

describe('Razorpay Signature Verification', () => {
  const secret = 'test_secret_key'

  beforeAll(() => {
    process.env.RAZORPAY_KEY_SECRET = secret
  })

  test('returns true for valid signature', () => {
    const orderId = 'order_test123'
    const paymentId = 'pay_test456'
    const body = orderId + '|' + paymentId
    const validSignature = crypto.createHmac('sha256', secret).update(body).digest('hex')

    const result = verifyRazorpaySignature(orderId, paymentId, validSignature)
    expect(result).toBe(true)
  })

  test('returns false for tampered signature', () => {
    const result = verifyRazorpaySignature('order_test123', 'pay_test456', 'fake_signature')
    expect(result).toBe(false)
  })
})