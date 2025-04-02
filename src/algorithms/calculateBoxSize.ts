import { ResizeObserverBoxOptions } from '../ResizeObserverBoxOptions';
import { ResizeObserverSize } from '../ResizeObserverSize';
import { DOMRectReadOnly } from '../DOMRectReadOnly';
import { isSVG, isHidden } from '../utils/element';
import { freeze } from '../utils/freeze';
import { global } from '../utils/global';

interface ResizeObserverSizeCollection {
  devicePixelContentBoxSize: ResizeObserverSize;
  borderBoxSize: ResizeObserverSize;
  contentBoxSize: ResizeObserverSize;
  contentRect: DOMRectReadOnly;
}

let cache = new WeakMap<Element, ResizeObserverSizeCollection>();
let scrollRegexp = /auto|scroll/;
let verticalRegexp = /^tb|vertical/;
let IE = (/msie|trident/i).test(global.navigator && global.navigator.userAgent);
let parseDimension = (pixel: string | null): number => parseFloat(pixel || '0');

// Helper to generate and freeze a ResizeObserverSize
let size = (inlineSize = 0, blockSize = 0, switchSizes = false): ResizeObserverSize => {
  return new ResizeObserverSize(
    (switchSizes ? blockSize : inlineSize) || 0,
    (switchSizes ? inlineSize : blockSize) || 0
  );
}

// Return this when targets are hidden
let zeroBoxes = freeze({
  devicePixelContentBoxSize: size(),
  borderBoxSize: size(),
  contentBoxSize: size(),
  contentRect: new DOMRectReadOnly(0, 0, 0, 0)
})

/**
 * Gets all box sizes of an element.
 */
let calculateBoxSizes = (target: Element, forceRecalculation = false): ResizeObserverSizeCollection => {

  // Check cache to prevent recalculating styles.
  if (cache.has(target) && !forceRecalculation) {
    return cache.get(target) as ResizeObserverSizeCollection;
  }

  // If the target is hidden, send zero
  if (isHidden(target)) {
    cache.set(target, zeroBoxes);
    return zeroBoxes;
  }

  let cs = getComputedStyle(target);

  // If element has an SVG box, handle things differently, using its bounding box.
  let svg = isSVG(target) && (target as SVGElement).ownerSVGElement && (target as SVGGraphicsElement).getBBox();

  // IE does not remove padding from width/height, when box-sizing is border-box.
  let removePadding = !IE && cs.boxSizing === 'border-box';

  // Switch sizes if writing mode is vertical.
  let switchSizes = verticalRegexp.test(cs.writingMode || '');

  // Could the element have any scrollbars?
  let canScrollVertically = !svg && scrollRegexp.test(cs.overflowY || '');
  let canScrollHorizontally = !svg && scrollRegexp.test(cs.overflowX || '');

  // Calculate properties for creating boxes.
  let paddingTop = svg ? 0 : parseDimension(cs.paddingTop);
  let paddingRight = svg ? 0 : parseDimension(cs.paddingRight);
  let paddingBottom = svg ? 0 : parseDimension(cs.paddingBottom);
  let paddingLeft = svg ? 0 : parseDimension(cs.paddingLeft);
  let borderTop = svg ? 0 : parseDimension(cs.borderTopWidth);
  let borderRight = svg ? 0 : parseDimension(cs.borderRightWidth);
  let borderBottom = svg ? 0 : parseDimension(cs.borderBottomWidth);
  let borderLeft = svg ? 0 : parseDimension(cs.borderLeftWidth);
  let horizontalPadding = paddingLeft + paddingRight;
  let verticalPadding = paddingTop + paddingBottom;
  let horizontalBorderArea = borderLeft + borderRight;
  let verticalBorderArea = borderTop + borderBottom;
  let horizontalScrollbarThickness = !canScrollHorizontally ? 0 : (target as HTMLElement).offsetHeight - verticalBorderArea - target.clientHeight;
  let verticalScrollbarThickness = !canScrollVertically ? 0 : (target as HTMLElement).offsetWidth - horizontalBorderArea - target.clientWidth;
  let widthReduction = removePadding ? horizontalPadding + horizontalBorderArea : 0;
  let heightReduction = removePadding ? verticalPadding + verticalBorderArea : 0;
  let contentWidth = svg ? svg.width : parseDimension(cs.width) - widthReduction - verticalScrollbarThickness;
  let contentHeight = svg ? svg.height : parseDimension(cs.height) - heightReduction - horizontalScrollbarThickness;
  let borderBoxWidth = contentWidth + horizontalPadding + verticalScrollbarThickness + horizontalBorderArea;
  let borderBoxHeight = contentHeight + verticalPadding + horizontalScrollbarThickness + verticalBorderArea;

  let boxes = freeze({
    devicePixelContentBoxSize: size(
      Math.round(contentWidth * devicePixelRatio),
      Math.round(contentHeight * devicePixelRatio),
      switchSizes
    ),
    borderBoxSize: size(borderBoxWidth, borderBoxHeight, switchSizes),
    contentBoxSize: size(contentWidth, contentHeight, switchSizes),
    contentRect: new DOMRectReadOnly(paddingLeft, paddingTop, contentWidth, contentHeight)
  });

  cache.set(target, boxes);

  return boxes;
};

/**
 * Calculates the observe box size of an element.
 * 
 * https://drafts.csswg.org/resize-observer-1/#calculate-box-size
 */
let calculateBoxSize = (target: Element, observedBox: ResizeObserverBoxOptions, forceRecalculation?: boolean): ResizeObserverSize => {
  let { borderBoxSize, contentBoxSize, devicePixelContentBoxSize } = calculateBoxSizes(target, forceRecalculation);
  switch (observedBox) {
    case ResizeObserverBoxOptions.DEVICE_PIXEL_CONTENT_BOX:
      return devicePixelContentBoxSize;
    case ResizeObserverBoxOptions.BORDER_BOX:
      return borderBoxSize;
    default:
      return contentBoxSize;
  }
};

export { calculateBoxSize, calculateBoxSizes };
