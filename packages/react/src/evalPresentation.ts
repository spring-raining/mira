import { render as ReactDOMRender } from 'react-dom';
import { renderElement } from './renderElement';
import { runtimeEnvironmentFactory } from './runtimeEnvironment';

// eslint-disable-next-line no-new-func
const AsyncFunctionShim = new Function(
  'return Object.getPrototypeOf(async function(){}).constructor',
)();

export class EvalPresentation extends HTMLElement {
  private mountPoint: HTMLDivElement;
  private evaluatedElement: any = null;

  constructor() {
    super();
    this.mountPoint = document.createElement('div');
    this.attachShadow({ mode: 'open' }).appendChild(this.mountPoint);
  }
  // attachedCallback
  // connectedCallback
  // disconnectedCallback
  // attributeChangedCallback
  // adoptedCallback

  async evaluateCode(code: string, scopeVal: Map<string, any>) {
    const environment = runtimeEnvironmentFactory();
    const runtimeScope = {
      ...environment.getRuntimeScope({
        scopeVal,
      }),
      $_default: (element: any) => {
        this.evaluatedElement = element;
      },
    };
    const evalScope = [
      ...new Map([...scopeVal, ...Object.entries(runtimeScope)]).entries(),
    ];
    const scopeKeys = evalScope.map(([k]) => k);
    const scopeValues = evalScope.map(([, v]) => v);
    try {
      this.evaluatedElement = null;
      const res = new AsyncFunctionShim(...scopeKeys, code);
      await res(...scopeValues);
      this.render();
    } catch (error) {
      // noop
    }
  }

  private render() {
    ReactDOMRender(
      renderElement(this.evaluatedElement, () => {
        // TODO
      }),
      this.mountPoint,
    );
  }
}
