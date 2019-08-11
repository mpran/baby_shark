'use strict';

export const debounce = (func, delay) => {
  let inDebounce;

  return () => {
    const context = this;
    const args = arguments;
    clearTimeout(inDebounce);
    inDebounce = setTimeout(() => func.apply(context, args), delay);
  }
}

export const copyText = (text) => {
  const el = document.createElement("textarea");

  el.setAttribute("type", "hidden");
  el.value = text;
  document.body.appendChild(el);

  el.select();

  document.execCommand("copy");
  document.body.removeChild(el);
};

export const addElement = (parentId, elementTag, elementId, html) => {
  removeElement(elementId);

  const parentEl = document.getElementById(parentId);
  const newElement = document.createElement(elementTag);

  newElement.id = elementId;
  newElement.innerHTML = html;

  parentEl.appendChild(newElement);
}

export const removeElement = (elementId) => {
  const element = document.getElementById(elementId);

  if (element) {
    element.parentNode.removeChild(element);
  }
}
