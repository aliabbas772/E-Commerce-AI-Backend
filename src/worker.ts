import { connectKafka } from './config/kafka'
import { startEmailConsumer } from './kafka/consumers/email.consumer'
import { startEmailWorker } from './queues/workers/email.worker'
import { startNotificationWorker } from './queues/workers/notification.worker'
import { logger } from './utils/logger.utils'

const startWorker = async () => {
  // Kafka consumer — handles high-volume order events
  await connectKafka()
  await startEmailConsumer()

  // BullMQ workers — handles retryable jobs
  startEmailWorker()
  startNotificationWorker()

  logger.info('✅ All workers started')
}

startWorker()