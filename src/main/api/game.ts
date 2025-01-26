import { gameInspector } from "@/main/game/inspect";
import { ipcMain } from "@/main/ipc/typed";
import { reg } from "@/main/registry/registry";

ipcMain.handle("listGames", () => reg.games.getAll());
ipcMain.handle("tellGame", (_, gameId: string) => gameInspector.tellGame(gameId));
