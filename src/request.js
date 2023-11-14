import delay from 'delay';

import { MAX_CALLBACK_RETRIES } from './constants';
import { FinalCallbackSetError } from './error';

export const State = Object.freeze({
  Pending: Symbol('Pending'),
  Complete: Symbol('Complete'),
  Unknown: Symbol('Unknown'),
  Failed: Symbol('Failed')
});

class Request {
  constructor (statusId, callback = null, input = null, signature = null) {
    this._state = State.Unknown;
    this.statusId = statusId;
    this.callback = callback;
    this.input = input;
    this.signature = signature;
  }

  get currentState () {
    return this._state;
  }

  get currentStatusId () {
    return this.statusId;
  }

  get currentInput () {
    return this.input;
  }
 
  get existingSigAuth () {
    return this.signature;
  }

  _setState (state) {
    this._state = state;
  }

  _serialize (signature = null) {
    return JSON.stringify({
      state: this._state.description,
      callback: this.callback,
      input: this.input,
      signature
    });
  }

  _deserialize (serializedRequest) {
    switch (serializedRequest.state) {
      case State.Pending.description:
        this._state = State.Pending;
        break;
      case State.Complete.description:
        this._state = State.Complete;
        break;
      case State.Unknown.description:
        this._state = State.Unknown;
        break;
      case State.Failed.description:
        this._state = State.Failed;
        break;
    }
    this.callback = serializedRequest.callback;
    this.input = serializedRequest.input;
    this.signature = serializedRequest.signature;
  }

  save (signature) {
    if (this.currentState === State.Unknown) {
      this._setState(State.Pending);
    }
    this._serialize(signature);
  }

  unpack (serializedRequest) {
    this._deserialize(serializedRequest);
  }
}

export class VerificationRequest extends Request {
  constructor (statusId, input, callback) {
    super(statusId, callback, input);
  }
}

export class ConfirmationRequest extends Request {
  constructor (statusId, sigAuth) {
    super(statusId);

    this.sigAuth = sigAuth;
    this.finishFn = null;
  }

  get sigAuthReceived () {
    return this.sigAuth;
  }

  setFinishCallback (finishFn) {
    if (this.finishFn && typeof this.finishFn === 'function') {
      throw new FinalCallbackSetError('Final callback already set');
    }
    this.finishFn = finishFn;
  }

  async finish (sigMatch) {
    this._setState(sigMatch ? State.Complete : State.Failed);

    const isVerified = this._state === State.Complete;
    const fullCallback = `${this.callback}?input=${encodeURIComponent(this.input)}&verified=${isVerified}`;

    let invokeCallback = await fetch(fullCallback);
    let retries = 0;

    while (invokeCallback.status !== 200 && retries <= MAX_CALLBACK_RETRIES) {
      invokeCallback = await fetch(fullCallback);
      ++retries;
      await delay(10000);
    }

    if (this.finishFn && typeof this.finishFn === 'function') {
      this.finishFn(isVerified);
    }
  }
}
