// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite(bgImg, fgImg, fgOpac, fgPos) {
    // Get dimensions of both images
    const bgWidth = bgImg.width;
    const bgHeight = bgImg.height;
    const fgWidth = fgImg.width;
    const fgHeight = fgImg.height;

    // Iterate over each pixel of the foreground image
    for (let y = 0; y < fgHeight; y++) {
        for (let x = 0; x < fgWidth; x++) {
            // Calculate background coordinates
            const bgX = fgPos.x + x;
            const bgY = fgPos.y + y;

            // Check if the foreground pixel is within background bounds
            if (bgX >= 0 && bgX < bgWidth && bgY >= 0 && bgY < bgHeight) {
                // Calculate pixel index
                const fgIndex = (y * fgWidth + x) * 4;
                const bgIndex = (bgY * bgWidth + bgX) * 4;

                // Get foreground RGBA values
                const fgR = fgImg.data[fgIndex];
                const fgG = fgImg.data[fgIndex + 1];
                const fgB = fgImg.data[fgIndex + 2];
                const fgA = fgImg.data[fgIndex + 3] * fgOpac;

                // Get background RGBA values
                const bgR = bgImg.data[bgIndex];
                const bgG = bgImg.data[bgIndex + 1];
                const bgB = bgImg.data[bgIndex + 2];
                const bgA = bgImg.data[bgIndex + 3];

                // Alpha blending formula
                const alpha = fgA / 255;
                const invAlpha = 1 - alpha;

                // Composite colors
                bgImg.data[bgIndex] = fgR * alpha + bgR * invAlpha;
                bgImg.data[bgIndex + 1] = fgG * alpha + bgG * invAlpha;
                bgImg.data[bgIndex + 2] = fgB * alpha + bgB * invAlpha;
                bgImg.data[bgIndex + 3] = Math.min(255, fgA + bgA * invAlpha);
            }
        }
    }
}
