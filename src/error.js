export class UnusableHTMLTemplateError extends Error {
  constructor (message) {
    super();
    this.name = 'UnusableHTMLTemplateError';
    this.message = message;
  }
}

export class UnusableAMPTemplateError extends Error {
  constructor (message) {
    super();
    this.name = 'UnusableAMPTemplateError';
    this.message = message;
  }
}

export class SMTPSettingsError extends Error {
  constructor (message) {
    super();
    this.name = 'SMTPSettingsError';
    this.message = message;
  }
}

export class FinalCallbackSetError extends Error {
  constructor (message) {
    super();
    this.name = 'FinalCallbackSetError';
    this.message = message;
  }
}

