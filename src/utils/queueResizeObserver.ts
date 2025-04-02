import { queueMicroTask } from './queueMicroTask';

let queueResizeObserver = (cb: () => void): void => {
  queueMicroTask(function ResizeObserver (): void {
    requestAnimationFrame(cb);
  });
}

export { queueResizeObserver }
