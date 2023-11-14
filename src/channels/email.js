import { createHmac } from 'crypto';
import { createReadStream } from 'streams';
import EmailValidation from 'emailvalid';
import replace from 'stream-replace';
import getFQDN from 'get-fqdn';

import { generateNumericCode } from '../code';
import Channel from '../channel';
import { 
  DEFAULT_SUBJECT,
  DEFAULT_MESSAGE,
  VALID_EMAIL_REGEX,
  VERIFY_LINK_REGEX
} from '../constants';
import { SMTPSettingsError } from './error';

export default class EmailChannel extends Channel {
  constructor (transporter, config) {
    super(config);

    this._ev = new EmailValidation({
      allowDisposable: config.allowDisposable || false,
      allowFreemail: config.allowFreemail || false,
    });
    this._transporter = transporter;
  }

  // Flow: User clicks link or submits code to finish verification
  async verify (message, signature) {
    const decoded = Buffer.from(message).toString('utf8');
    const computed = createHmac('sha256', this._config.secretKey)
      .update(decoded).digest('hex');
    return signature === computed;
  }

  // Flow: Validate email is real if necessary
  validate (email) {
    return this._ev.check(email);
  }

  // Flow: Code is generated and verify link is deployed to email
  async deploy (to, statusId) {
    const code = generateNumericCode();
    const message = JSON.stringify({
      code,
      ts: Date.now()
    });
    const signature = createHmac('sha256', this._config.secretKey).update(message).digest('hex');
    const encodedMessage = Buffer.from(message).toString('base64');
    
    let fqdn;

    if (!process.env.DOMAIN) {
      try {
        fqdn = await getFQDN();
      } catch (err) {
        // TODO: use server IP
      }
    }
    
    const generatedLink = `${fqdn}/verify/${statusId}?sigAuth=${encodedMessage}`;
    
    let envelope = {
      from: this._config.smtpConfiguration.auth.user,
      to,
      subject: this._config.envelope.customSubject || `${DEFAULT_SUBJECT}: ${code}`,
      text: this._config.envelope.customTextMessage || `${DEFAULT_MESSAGE}: ${generatedLink}`
    };

    let htmlStream;

    if (this._config.htmlTemplate && this._config.htmlTemplate.length) {
      htmlStream = createReadStream(this._config.htmlTemplate).pipe(replace(VERIFY_LINK_REGEX, generatedLink));
      envelope = Object.assign({}, envelope, {
        html: htmlStream
      });
    }
    if (this._config.ampTemplate && this._config.ampTemplate.length) {
      ampStream = createReadStream(this._config.ampTemplate).pipe(replace(VERIFY_LINK_REGEX, generatedLink));
      envelope = Object.assign({}, envelope, {
        amp: ampStream
      });
    }
    let response;
    try {
      response = await this._transporter.sendMail(envelope);
    } catch (err) {
      console.error(err); // TODO: use a logger
      if (htmlStream) {
        htmlStream.pause();
      }
      if (ampStream) {
        ampStream.pause();
      }
    } finally {
      if (htmlStream) {
        htmlStream.destroy();
      }
      if (ampStream) {
        ampStream.destroy();
      }
    }
    return signature;
  }

  cleanup () {
    this._transporter.close();
  }

  matches (input) {
    return VALID_EMAIL_REGEX.test(input);
  }

  static async open (config) { // TODO: support other transports
    const transport = await initializeMailer(config.smtpConfiguration, 
      (config.transports ? config.transports.sendMail : false)
    );
    return new EmailChannel(transport, config);
  }
}

async function initializeMailer (config, useExternalTransport) {
  const importUseTransport = async () => await import(useExternalTransport ? '../transports/mail/sendmail' : '../transports/mail/default');
  const { useTransport } = await importUseTransport();
  const transporter = useTransport(config);
  const verified = await transporter.verify();
  if (!verified) {
    throw new SMTPSettingsError('Unable to verify SMTP settings');
  }
  return transporter;
}
