import { State, ConfirmationRequest } from './request';

export default function dispatch (registeredChannels, verificationRegistry) {
  return async (req) => {
    if (req instanceof ConfirmationRequest) {
      const pendingReq = await verificationRegistry.get(req.currentStatusId);
      req.unpack(pendingReq);
    }
    for (const channel of registeredChannels) {
      if (channel.matches(req.currentInput) && channel.validate(req.currentInput)) {
        if (req.currentState === State.Unknown) {
          const sig = await channel.deploy(req.currentInput, req.currentStatusId);
          await verificationRegistry.put(req.currentStatusId, req.save(sig));
        } else if (req.currentState === State.Pending) {
          const messageMatch = await channel.verify(req.sigAuthReceived, req.existingSig);
          await req.finish(messageMatch);
          await verificationRegistry.put(req.currentStatusId, req.save(null));
        }
        break;
      }
    }
  }
}
