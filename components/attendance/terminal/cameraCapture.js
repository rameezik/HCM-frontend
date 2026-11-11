const wait = (milliseconds, signal) =>
  new Promise((resolve, reject) => {
    const finish = () => {
      signal.removeEventListener("abort", cancel);
      resolve();
    };
    const timer = setTimeout(finish, milliseconds);
    const cancel = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
      reject(new DOMException("Capture stopped", "AbortError"));
    };
    if (signal.aborted) cancel();
    else signal.addEventListener("abort", cancel, { once: true });
  });

export async function captureCameraSamples(video, capture, signal) {
  const samples = [],
    canvas = document.createElement("canvas");
  try {
    for (let index = 0; index < 3; index++) {
      signal.throwIfAborted();
      if (
        !video ||
        video.readyState < 2 ||
        video.videoWidth < 160 ||
        video.videoHeight < 160
      )
        throw new Error(
          "The camera frame is not ready. Keep one face visible and retry.",
        );
      const scale = Math.min(
        1,
        Math.min(640, capture?.maxWidth || 640) /
          Math.max(video.videoWidth, video.videoHeight),
      );
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const context = canvas.getContext("2d", { alpha: false });
      if (!context)
        throw new Error("This browser cannot capture camera frames.");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = canvas.toDataURL("image/jpeg", 0.86).split(",")[1];
      if (
        !image ||
        Math.ceil((image.length * 3) / 4) >
          Math.min(250000, capture?.maxImageBytes || 250000)
      )
        throw new Error(
          "The camera image is too large. Retry with a lower-resolution camera.",
        );
      samples.push(image);
      if (index < 2) await wait(350, signal);
    }
    return samples;
  } catch (error) {
    samples.fill("");
    throw error;
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}
