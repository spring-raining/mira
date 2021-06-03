import type { AppProps } from 'next/app';
import { RecoilRoot } from 'recoil';
import 'reflect-metadata';
import '@mirajs/wui/styles.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <RecoilRoot>
      <Component {...pageProps} />
    </RecoilRoot>
  );
}

export default MyApp;
