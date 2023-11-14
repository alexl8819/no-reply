import validateNANumber from 'validate-na-number';

import { generateNumericCode } from '../code';
import Channel from '../channel';

export default class SMSChannel extends Channel {
  constructor (transporter, config) {
    super(config);

    this._transporter = transporter;
  }

  // Flow: User clicks link or submits code to finish verification
  async verify (number) {
  }

  validate () {

  }

  // Flow: Code is generated and verify link is deployed to SMS
  async deploy (to) {
  }

  async cleanup () {
    
  }

  // TODO: support international numbers
  matches (input) {
    return validateNANumber(input);
  }

  static async open (config) {
    // const transport = await initializeDialer(config);
  }
}

function initializeDialer (config) {}
