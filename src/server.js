import { 
  access, 
  constants 
} from 'fs/promises';

import Fastify from 'fastify';
import queue from 'fastq';
import level from 'level-party';
import ttl from 'level-ttl';

import EmailChannel from './channels/email';
import {
  startVerification,
  finishVerification 
} from './handler';
import dispatch from './worker';
import { DEFAULT_REGISTRY_TTL } from './constants';
import {
  UnusableHTMLTemplateError,
  UnusableAMPTemplateError
} from './error';

export default async function createServer (opts = Object.assign({}, opts, { logger: true })) {
  if (opts.htmlTemplate && opts.htmlTemplate.length) {
    const htmlTemplateUsable = await access(opts.htmlTemplate, constants.R_OK);
    if (!htmlTemplateUsable) {
      throw new UnusableHTMLTemplateError('Unable to read html template');
    }
  }

  if (opts.ampTemplate && opts.ampTemplate.length) {
    const ampTemplateUsable = await access(opts.ampTemplate, constants.R_OK);
    if (!ampTemplateUsable) {
      throw new UnusableAMPTemplateError('Unable to read amp template');
    }
  }

  const fastify = Fastify(opts);
  const verificationRegistry = ttl(level('./vr'), {
    defaultTTL: DEFAULT_REGISTRY_TTL
  });

  const registeredChannels = await Promise.all([ // TODO: dynamically invoke all implemented classes
    await EmailChannel.open(Object.assign({}, opts.config, {
      htmlTemplate: opts.htmlTemplate || '',
      ampTemplate: opts.ampTemplate || ''
    }))
  ]);

  const q = queue.promise(dispatch(registeredChannels, verificationRegistry), opts.maxQueue || 10); // in-memory 
  
  fastify.addSchema({
    $id: 'submissionSchema',
    type: 'object',
    properties: {
      input: {
        type: 'string'
      },
      callback: {
        type: 'string'
      }
    }
  });
  // Internal API to check status of verification
  // fastify.get('/verify/status/:queryId', async (req) => {});
  // Endpoint for user to finish verification process
  fastify.get('/verify/:requestId', finishVerification(q));
  // Endpoint for new verification submissions
  fastify.post('/verify', {
    handler: startVerification(q),
    schema: {
      body: {
        $ref: 'submissionSchema#'
      }
    }
  });
  fastify.listen({ 
    host: opts.host || '0.0.0.0', 
    port: opts.port || 3000 
  }, (err, address) => {
    if (err) {
      console.error(err);
      fastify.close();
      return;
    }
  });
  return {
    shutdown: () => {
      verificationRegistry.close();
      q.kill();
      fastify.close();
    }
  };
}
