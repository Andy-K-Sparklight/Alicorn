import { ipcMain } from "@/main/ipc/typed";
import { reg } from "@/main/registry/registry";

ipcMain.handle("listGames", () => reg.games.getAll());
