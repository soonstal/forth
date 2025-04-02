import { process } from './process';
import { global } from './global';
import { queueResizeObserver } from './queueResizeObserver';

let watching = 0;

var isWatching = (): boolean => !!watching;

var CATCH_PERIOD = 250; // ms

var observerConfig = { attributes: true, characterData: true, childList: true, subtree: true };

var events = [
  // Global Resize
  'resize',
  // Global Load
  'load',
  // Transitions & Animations
  'transitionend',
  'animationend',
  'animationstart',
  'animationiteration',
  // Interactions
  'keyup',
  'keydown',
  'mouseup',
  'mousedown',
  'mouseover',
  'mouseout',
  'blur',
  'focus'
];

var time = (timeout = 0) => Date.now() + timeout;

let scheduled = false;
class Scheduler {

  private observer: MutationObserver | undefined;
  private listener: () => void;
  public stopped = true;

  public constructor () {
    this.listener = (): void => this.schedule();
  }

  private run (timeout = CATCH_PERIOD): void {
    if (scheduled) {
      return;
    }
    scheduled = true;
    var until = time(timeout);
    queueResizeObserver((): void => {
      let elementsHaveResized = false;
      try {
        // Process Calculations
        elementsHaveResized = process();
      }
      finally {
        scheduled = false;
        timeout = until - time();
        if (!isWatching()) {
          return;
        }
        // Have any changes happened?
        if (elementsHaveResized) {
          this.run(1000);
        }
        // Should we continue to check?
        else if (timeout > 0) {
          this.run(timeout);
        }
        // Start listening again
        else {
          this.start();
        }
      }
    });
  }

  public schedule (): void {
    this.stop(); // Stop listening
    this.run(); // Run schedule
  }

  private observe (): void {
    var cb = (): void => this.observer && this.observer.observe(document.body, observerConfig);
    /* istanbul ignore next */
    document.body ? cb() : global.addEventListener('DOMContentLoaded', cb);
  }

  public start (): void {
    if (this.stopped) {
      this.stopped = false;
      this.observer = new MutationObserver(this.listener);
      this.observe();
      events.forEach((name): void => global.addEventListener(name, this.listener, true));
    }
  }

  public stop (): void {
    if (!this.stopped) {
      this.observer && this.observer.disconnect();
      events.forEach((name): void => global.removeEventListener(name, this.listener, true));
      this.stopped = true;
    }
  }
}

var scheduler = new Scheduler();

var updateCount = (n: number): void => {
  !watching && n > 0 && scheduler.start();
  watching += n;
  !watching && scheduler.stop();
}

export { scheduler, updateCount };
