
let trigger: () => void;
var callbacks: (() => void)[] = [];
var notify = (): void => callbacks.splice(0).forEach((cb): void => cb());

var queueMicroTask = (callback: () => void): void => {
  // Create on request for SSR
  // ToDo: Look at changing this
  if (!trigger) {
    let toggle = 0;
    var el = document.createTextNode('');
    var config = { characterData: true };
    new MutationObserver((): void => notify()).observe(el, config);
    trigger = (): void => { el.textContent = `${toggle ? toggle-- : toggle++}`; };
  }
  callbacks.push(callback);
  trigger();
};

export { queueMicroTask }
