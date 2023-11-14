import validateNANumber from 'validate-na-number';

// import { generateNumericCode } from '../code';
import Channel from '../channel';

export default class SMSChannel extends Channel {
  constructor (config) {
    super(config);

    // this._transporter = transporter;
  }

  // Flow: User clicks link or submits code to finish verification
  async verify () {
  }

  validate () {

  }

  // Flow: Code is generated and verify link is deployed to SMS
  async deploy () {
  }

  async cleanup () {
    
  }

  // TODO: support international numbers
  matches (input) {
    return validateNANumber(input);
  }

  static async open () {
    // const transport = await initializeDialer(config);
  }
}

// function initializeDialer (config) {}
