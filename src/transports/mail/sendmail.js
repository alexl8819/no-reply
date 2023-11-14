import { createTransport } from 'nodemailer';

export function useTransport (config) {
  return createTransport(Object.assign({}, config, {
    sendmail: true
  }))
}
