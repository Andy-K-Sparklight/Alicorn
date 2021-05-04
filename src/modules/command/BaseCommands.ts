export async function echo(
  w: string,
  log: (msg: string) => void
): Promise<void> {
  log(w.replace(/echo( )*/i, ""));
}
