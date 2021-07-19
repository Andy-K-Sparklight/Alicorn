export declare function showDialog(
  msg: string,
  mode?: string,
  title?: string,
  onAccept?: () => unknown,
  cover?: number,
  onCancel?: () => unknown,
  leftMsg?: string,
  confirm?: string,
  cancel?: string,
  closeTime?: number,
  locationTime?: number
): void;

export declare function showError(msg: string): void;
