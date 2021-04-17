export let add = (a: number, b: number) => {
  return a + b;
};

if (import.meta.hot) {
  import.meta.hot.accept(module => {
    add = module.add;
  })
}
