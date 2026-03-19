"use client";

type ShareUrlInput = {
  title: string;
  url: string;
};

export type ShareUrlResult = "shared" | "copied" | "cancelled";

export async function shareUrl({
  title,
  url
}: ShareUrlInput): Promise<ShareUrlResult> {
  try {
    if (typeof navigator.share === "function") {
      await navigator.share({ title, url });
      return "shared";
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "cancelled";
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return "copied";
  }

  const textArea = document.createElement("textarea");
  textArea.value = url;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);

  return "copied";
}
