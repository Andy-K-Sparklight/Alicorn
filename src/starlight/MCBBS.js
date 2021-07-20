export function showDialog(...args) {
  (unsafeWindow || window).showDialog(...args);
}

export function showError(...args) {
  (unsafeWindow || window).showError(...args);
}
