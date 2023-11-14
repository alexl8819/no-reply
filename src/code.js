import { customAlphabet, nanoid } from 'nanoid';

export function generateUniqueId (size = 8) {
  return nanoid(size);
}

export function generateNumericCode (size = 6) {
  return customAlphabet('1234567890', size)();
}

