export type QueryResult = Record<string, [string, string]>;
export function makeQuery(
  networkName: string,
  mapHost: string
): Promise<QueryResult> {
  return new Promise<QueryResult>((res, rej) => {
    const t = setTimeout(() => {
      rej("Timeout!");
    }, 3000);
    try {
      const ws = new WebSocket(mapHost);
      ws.onerror = (e) => {
        clearTimeout(t);
        e.preventDefault();
        rej("Connection failed");
        return false;
      };
      ws.onmessage = (e) => {
        try {
          res(JSON.parse(e.data));
        } catch {
          rej(e.data);
        } finally {
          clearTimeout(t);

          ws.close();
        }
      };
      ws.onopen = () => {
        ws.send(JSON.stringify([0, 0, networkName]));
      };
    } catch (e) {
      clearTimeout(t);
      rej(e);
    }
  });
}

export function askRemove(
  networkName: string,
  hostIp: string,
  password: string,
  mapHost: string
): Promise<void> {
  return new Promise<void>((res, rej) => {
    const t = setTimeout(() => {
      rej("Timeout!");
    }, 5000);
    try {
      const ws = new WebSocket(mapHost);
      ws.onerror = (e) => {
        clearTimeout(t);
        e.preventDefault();
        rej("Connection failed");
        return false;
      };
      ws.onmessage = (e) => {
        if (e.data === "") {
          res();
        } else {
          rej(e.data);
        }
        clearTimeout(t);
        ws.close();
      };
      ws.onopen = () => {
        ws.send(JSON.stringify([1, 1, networkName, hostIp, password]));
      };
    } catch (e) {
      clearTimeout(t);
      rej(e);
    }
  });
}
export function askCreate(
  networkName: string,
  hostIp: string,
  password: string,
  worldName: string,
  description: string,
  mapHost: string
): Promise<void> {
  return new Promise<void>((res, rej) => {
    const t = setTimeout(() => {
      rej("Timeout!");
    }, 5000);
    try {
      const ws = new WebSocket(mapHost);
      ws.onerror = (e) => {
        clearTimeout(t);
        e.preventDefault();
        rej("Connection failed");
        return false;
      };
      ws.onmessage = (e) => {
        if (e.data === "") {
          res();
        } else {
          rej(e.data);
        }
        clearTimeout(t);
        ws.close();
      };
      ws.onopen = () => {
        ws.send(
          JSON.stringify([
            1,
            0,
            networkName,
            hostIp,
            password,
            worldName,
            description,
          ])
        );
      };
    } catch (e) {
      clearTimeout(t);
      rej(e);
    }
  });
}
