import path from "path";
import { isFileExist } from "../commons/FileUtil";
import { getActualDataPath } from "../config/DataSupport";
import { resetJavaList } from "./JavaInfo";

export async function setBuiltInJava(): Promise<void> {
    const j1 = getActualDataPath(path.join("java", "legacy", "default"));
    const j2 = getActualDataPath(path.join("java", "modern", "default"));
    const l = [];
    if (await isFileExist(j1)) {
        l.push(j1);
    }
    if (await isFileExist(j2)) {
        l.push(j2);
    }
    if (l.length > 0) {
        resetJavaList(l); // Ensure a 'clean' env
    }
}
