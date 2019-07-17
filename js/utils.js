export const debounce = (func, delay) => {
  let inDebounce;

  return () => {
    const context = this;
    const args = arguments;
    clearTimeout(inDebounce);
    inDebounce = setTimeout(() => func.apply(context, args), delay);
  }
}

export const copyText = text => {
  const el = document.createElement("textarea");
  el.setAttribute("type", "hidden");
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
};
