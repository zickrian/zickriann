import { Resend } from "resend"

let client: Resend | null = null

export function getResendClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.")
  }

  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY)
  }

  return client
}

export type ContactEmailPayload = {
  senderName: string
  senderEmail: string
  subject: string
  message: string
  chatContext?: string
}
