import { ResizeObserver } from '../ResizeObserver';
import { ResizeObserverEntry } from '../ResizeObserverEntry';
import { ResizeObserverSize } from '../ResizeObserverSize';

type IsomorphicWindow = Window & {
  ResizeObserver?: typeof ResizeObserver;
  ResizeObserverEntry?: typeof ResizeObserverEntry;
  ResizeObserverSize?: typeof ResizeObserverSize;
}

/* istanbul ignore next */
export let global: IsomorphicWindow =
typeof window !== 'undefined' ? window : {} as unknown as Window;
