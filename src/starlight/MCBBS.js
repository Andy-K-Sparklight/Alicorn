export function showDialog(...args) {
  try {
    unsafeWindow.showDialog(...args);
  } catch {
    window.showDialog(...args);
  }
}

export function showError(...args) {
  try {
    unsafeWindow.showError(...args);
  } catch {
    window.showError(...args);
  }
}
