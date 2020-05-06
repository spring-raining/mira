// Derived from react-live source
// https://github.com/FormidableLabs/react-live
import React from 'react';
import { LiveContext } from 'react-live';
import { transform as _transform } from 'buble';
import assign from 'core-js/fn/object/assign';
import { getRuntimeScope } from './runtimeScopes';
import { Providence } from './Universe';

const _poly = { assign };
const evalCode = (code, scope) => {
  const scopeKeys = Object.keys(scope);
  const scopeValues = scopeKeys.map((key) => scope[key]);
  // eslint-disable-next-line no-new-func
  const res = new Function('_poly', 'React', ...scopeKeys, code);
  return res(_poly, React, ...scopeValues);
};

const transform = (code) =>
  _transform(code, {
    objectAssign: '_poly.assign',
    transforms: {
      dangerousForOf: true,
      dangerousTaggedTemplateString: true,
    },
  });

const errorBoundary = (errorCallback) => (Element) => {
  return class ErrorBoundary extends React.Component {
    componentDidCatch(error) {
      errorCallback(error);
    }

    render() {
      return typeof Element === 'function' ? <Element /> : Element;
    }
  };
};

const renderElementAsync = (
  { code = '', scope = {} },
  resultCallback,
  errorCallback
  // eslint-disable-next-line consistent-return
) => {
  const runtimeScope = getRuntimeScope({
    resultCallback,
    errorCallback,
    errorBoundary: errorBoundary(errorCallback),
  });

  const transformed = transform(code);
  return evalCode(transformed.code, { ...scope, ...runtimeScope });
};

export class CodeBlockProvider extends React.Component<{
  code: string;
  scope: object;
  providence: Providence;
  onProvidenceUpdate?: (val: Providence) => void;
  asteroidId?: string;
  transformCode?: React.ReactNode;
}> {
  static defaultProps = {
    code: '',
    onProvidenceUpdate: () => {},
  };

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
    const { code, scope, transformCode } = this.props;

    this.transpile({ code, scope, transformCode });
  }

  componentDidUpdate({
    code: prevCode,
    scope: prevScope,
    transformCode: prevTransformCode,
    providence,
  }) {
    const { code, scope, transformCode } = this.props;
    if (
      code !== prevCode ||
      scope !== prevScope ||
      transformCode !== prevTransformCode
    ) {
      this.transpile({ code, scope, transformCode });
    }
  }

  onChange = (code) => {
    const { scope, transformCode } = this.props;
    this.transpile({ code, scope, transformCode });
  };

  onError = (error) => {
    this.setState({ error: error.toString() });
  };

  transpile = ({ code, scope, transformCode }) => {
    const { providence, onProvidenceUpdate, asteroidId } = this.props;
    // Transpilation arguments
    const input = {
      code: transformCode ? transformCode(code) : code,
      scope,
    };

    const errorCallback = (err) =>
      this.setState({ element: undefined, error: err.toString() });
    const renderElement = (element) => this.setState({ ...state, element });

    // State reset object
    const state = { unsafeWrapperError: undefined, error: undefined };

    try {
      this.setState({ ...state, element: null }); // Reset output for async (no inline) evaluation

      const ret = renderElementAsync(input, renderElement, errorCallback);
      if (asteroidId) {
        onProvidenceUpdate({
          ...providence,
          asteroidReturn: {
            ...providence.asteroidReturn,
            [asteroidId]: typeof ret === 'object' ? ret : null,
          },
        });
      }
    } catch (error) {
      this.setState({ ...state, error: error.toString() });
      if (asteroidId) {
        delete providence.asteroidReturn[asteroidId];
        onProvidenceUpdate({
          ...providence,
          asteroidReturn: providence.asteroidReturn,
        });
      }
    }
  };

  render() {
    const { children, code } = this.props;

    return (
      <LiveContext.Provider
        value={
          {
            ...this.state,
            code,
            onError: this.onError,
            onChange: this.onChange,
          } as any
        }
      >
        {children}
      </LiveContext.Provider>
    );
  }
}
