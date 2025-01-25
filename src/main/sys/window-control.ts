import { screen } from "electron";

/**
 * Gets an optimal window size for the main window.
 *
 * This function sizes the window based on the size of the primary display, with the fixed aspect ratio 16:10 and scale
 * factor 0.6.
 */
function optimalSize(): [number, number] {
    let { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const ratio = width / height;
    const expRatio = 16 / 10;
    if (ratio > expRatio) {
        width = height * expRatio;
    } else {
        height = width / expRatio;
    }

    const scaleFactor = 0.8;

    return [Math.round(width * scaleFactor), Math.round(height * scaleFactor)];
}

export const windowControl = { optimalSize };
