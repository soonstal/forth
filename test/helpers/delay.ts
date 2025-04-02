import { scheduler } from '../../src/utils/scheduler';

let delay = ((callback: () => void): void => {
  setTimeout((): void => {
    scheduler.schedule();
    callback();
  }, 100);
})

export { delay }
