const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

/**
 * Check if a prompt result is already cached before opening an SSE stream.
 * @param {string} prompt
 * @returns {Promise<{cached: boolean, cache_key: string}>}
 */
export async function checkCache(prompt) {
  const res = await fetch(`${API_BASE}/check-cache/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ prompt }),
  });
  return res.json();
}

/**
 * Stream project generation via SSE.
 *
 * @param {string} prompt
 * @param {{
 *   onStep?:   (data: {step: string, message: string, file?: string}) => void,
 *   onFile?:   (data: {path: string, content: string}) => void,
 *   onReview?: (data: {review: string}) => void,
 *   onCached?: (data: object) => void,
 *   onDone?:   () => void,
 *   onError?:  (message: string) => void,
 * }} callbacks
 * @returns {{ abort: () => void }}  Call abort() to cancel the stream
 */
export function generateProject(prompt, callbacks = {}) {
  const {
    onStep = () => {},
    onFile = () => {},
    onReview = () => {},
    onCached = () => {},
    onDone = () => {},
    onError = () => {},
  } = callbacks;

  // We POST then read the response body as a stream manually,
  // because EventSource only supports GET.
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${API_BASE}/generate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        onError(err.error || "Unknown server error");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop(); // keep incomplete chunk

        for (const chunk of lines) {
          const eventMatch = chunk.match(/^event: (\w+)/);
          const dataMatch = chunk.match(/\ndata: (.+)/s);
          if (!eventMatch || !dataMatch) continue;

          const event = eventMatch[1];
          let data;
          try {
            data = JSON.parse(dataMatch[1]);
          } catch {
            continue;
          }

          switch (event) {
            case "step_start":
            case "step_done":
              onStep(data);
              break;
            case "file_done":
              onFile(data);
              break;
            case "review_done":
              onReview(data);
              break;
            case "cached":
              onCached(data);
              break;
            case "done":
              onDone();
              break;
            case "error":
              onError(data.message);
              break;
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        onError(err.message);
      }
    }
  })();

  return { abort: () => controller.abort() };
}
