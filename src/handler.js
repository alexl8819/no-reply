/*
 * Input:
 * {
 *    input: 'test@test.com',
 *    callback: 'mysite.com/register/verify'
 * }
 *
 * Output (callback):
 *
 * mysite.com/register/verify?email=test@test.com&verified=true&ts=9487184789
 *
 * */
import { generateUniqueId } from './code';
import { VerificationRequest, ConfirmationRequest } from './request';

export function startVerification (q) {
  return (req, res) => {
    const { input, callback } = req.body;
    const statusId = generateUniqueId();
    q.push(new VerificationRequest(statusId, input, callback));
    res.send(200).json({
      statusId
    });
  }
}

export function finishVerification (q) {
  return (req, res) => {
    const { params, query } = req;
    const { sigAuth } = query;
    const { requestId } = params;
    const confirmationReq = new ConfirmationRequest(requestId, sigAuth);
    confirmationReq.setFinishCallback((isVerified) => {
      res.send(200).json({
        verified: isVerified
      });
    });
    q.push(confirmationReq);
  }
}
