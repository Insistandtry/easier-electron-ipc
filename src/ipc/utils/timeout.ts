import { DEFAULT_IPC_TIMEOUT } from '../constants';

export const timeoutWrapper = (promise: Promise<any>, options?: { timeout: number }) => {
  const timeout = options?.timeout ?? DEFAULT_IPC_TIMEOUT;
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject('promise timeout!');
    }, timeout);
  });
  return Promise.race([promise, timeoutPromise]);
};
