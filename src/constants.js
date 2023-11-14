export const DEFAULT_REGISTRY_TTL = 60 * 60 * 1000; // 1 hr expiry
export const VALID_EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
export const VERIFY_LINK_REGEX = /\{VERIFICATION_LINK\}/g;
export const DEFAULT_SUBJECT = 'Your verification code';
export const DEFAULT_MESSAGE = 'Please click the following link to verify your email:';
export const MAX_CALLBACK_RETRIES = 3;
