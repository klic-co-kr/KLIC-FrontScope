/// <reference lib="dom" />

interface HTMLImageElement extends Element {
  readonly tagName: 'IMG';
}

interface HTMLAnchorElement extends Element {
  readonly tagName: 'A';
}

interface HTMLInputElement extends Element {
  readonly tagName: 'INPUT';
  type: string;
}

interface HTMLTextAreaElement extends Element {
  readonly tagName: 'TEXTAREA';
}

interface HTMLButtonElement extends Element {
  readonly tagName: 'BUTTON';
}

interface HTMLSelectElement extends Element {
  readonly tagName: 'SELECT';
}
