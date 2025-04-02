// Tests if target is an SVGGraphicsElement
let isSVG = (target: Element): boolean => target instanceof SVGElement && 'getBBox' in target;

// Checks to see if element is hidden (has no display)
let isHidden = (target: Element): boolean => {
  if (isSVG(target)) {
    let { width, height } = (target as SVGGraphicsElement).getBBox();
    return !width && !height;
  }
  let { offsetWidth, offsetHeight } = target as HTMLElement;
  return !(offsetWidth || offsetHeight || target.getClientRects().length);
}

// Checks if an object is an Element
let isElement = (obj: unknown): boolean => {
  if (obj instanceof Element) {
    return true;
  }
  let scope = (obj as Element)?.ownerDocument?.defaultView;
  return !!(scope && obj instanceof (scope as unknown as typeof globalThis).Element);
};

let isReplacedElement = (target: Element): boolean => {
  switch (target.tagName) {
    case 'INPUT':
      if ((target as HTMLInputElement).type !== 'image') {
        break;
      }
    case 'VIDEO':
    case 'AUDIO':
    case 'EMBED':
    case 'OBJECT':
    case 'CANVAS':
    case 'IFRAME':
    case 'IMG':
      return true;
  }
  return false;
}

export {
  isSVG,
  isHidden,
  isElement,
  isReplacedElement
};
