// Short message at the bottom of the screen, the counterpart of Android toasts

let timer: number | undefined;

export function toast(text: string): void {
  const view = document.getElementById('toast')!;
  view.textContent = text;
  view.classList.add('visible');
  clearTimeout(timer);
  timer = window.setTimeout(() => view.classList.remove('visible'), 2500);
}

export async function copyToClipboard(label: string, text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${label} copied to clipboard`);
  } catch (e) {
    toast('Copying to clipboard failed');
  }
}
