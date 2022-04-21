import { ReactiveElement, PropertyValues } from '@lit/reactive-element';
import { property } from '@lit/reactive-element/decorators/property.js';
import { RuntimeScope, MiraEvalBase } from '@mirajs/core';
import { renderElement } from './renderElement';
import { runtime } from './runtime';
import { RuntimeEnvironmentConfig } from './types';

export class MiraEval extends ReactiveElement implements MiraEvalBase {
  private mountPoint: HTMLDivElement;
  private evaluatedElement: any = null;
  private runtimeScope: RuntimeScope | undefined;

  @property({
    attribute: false,
  })
  config: RuntimeEnvironmentConfig = {};

  @property({
    attribute: false,
  })
  props: Record<string, unknown> = {};

  constructor() {
    super();
    this.mountPoint = document.createElement('div');
    this.attachShadow({ mode: 'open' }).appendChild(this.mountPoint);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.runtimeScope?.$unmount(null, this.mountPoint);
  }

  protected update(changedProperties: PropertyValues): void {
    super.update(changedProperties);
    const event = new CustomEvent('props-change', {
      detail: this.props || {},
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  async evaluateCode(): Promise<void> {
    // no code evaluation
  }

  async loadScript(src: string): Promise<void> {
    const env = runtime({ config: this.config });
    this.runtimeScope = env.getRuntimeScope({});
    for (const [k, v] of Object.entries(this.runtimeScope)) {
      (globalThis as any)[k] = v;
    }

    try {
      this.evaluatedElement = null;
      const mod = await import(/* @vite-ignore */ src);
      if (mod.default) {
        this.evaluatedElement = mod.default;
      }
      this.render();
    } catch (error) {
      this.handleError(error);
    }
  }

  private render() {
    this.runtimeScope?.$mount(
      renderElement(this.evaluatedElement, this.props, this, this.handleError),
      this.mountPoint,
    );
  }

  private handleError(error: unknown) {
    // TODO
    console.error(error);
  }
}

export default MiraEval;
