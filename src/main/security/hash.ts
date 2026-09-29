import { getNative } from "@/main/native-loader";

async function checkFile(pt: string, algorithm: string, expectHash: string): Promise<boolean> {
    return (await forFile(pt, algorithm)) === expectHash.trim().toLowerCase();
}

async function forFile(pt: string, algorithm: string): Promise<string> {
    const h = (await getNative().hashFile(pt, algorithm)) as string;

    if (!h) throw `Failed to hash file: ${pt}`;
    return h;
}

export const hash = {
    forFile,
    checkFile,
};
