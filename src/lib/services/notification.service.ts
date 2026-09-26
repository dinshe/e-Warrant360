// Notification adapter — providers can be swapped without changing business logic
import { prisma } from '@/lib/db'
import { NotificationEvent, NotificationChannel } from '@prisma/client'

export interface NotificationPayload {
  event: NotificationEvent
  channel: NotificationChannel
  recipient: string
  subject?: string
  body: string
  metadata?: Record<string, unknown>
}

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<void>
}

// Console provider (development / placeholder)
class ConsoleNotificationProvider implements NotificationProvider {
  async send(payload: NotificationPayload): Promise<void> {
    console.log('[NOTIFICATION]', JSON.stringify(payload, null, 2))
  }
}

// Email provider — configure SMTP or Resend in .env
class EmailNotificationProvider implements NotificationProvider {
  async send(payload: NotificationPayload): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[EMAIL]', payload.subject, '->', payload.recipient)
      return
    }
    // Production: plug in Nodemailer / Resend / SendGrid here
    throw new Error('Email provider not configured for production')
  }
}

const providers: Record<NotificationChannel, NotificationProvider> = {
  EMAIL: new EmailNotificationProvider(),
  SMS: new ConsoleNotificationProvider(),
  WHATSAPP: new ConsoleNotificationProvider(),
}

export async function sendNotification(
  payload: NotificationPayload,
  shopId?: string,
): Promise<void> {
  const log = await prisma.notificationLog.create({
    data: {
      shopId,
      event: payload.event,
      channel: payload.channel,
      recipient: payload.recipient,
      status: 'PENDING',
      metadata: payload.metadata as object,
    },
  })

  try {
    await providers[payload.channel].send(payload)
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: 'SENT', sentAt: new Date() },
    })
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: 'FAILED', error },
    })
    // Do NOT re-throw — notification failure must never break warranty transactions
  }
}
