import { Component } from "@angular/core";

@Component({
  selector: "app-triple-star",
  template: `
    <svg
      class="triple-star"
      viewBox="0 0 32 32"
      width="1.35em"
      height="1.35em"
      fill="currentColor"
      aria-hidden="true"
    >
      <g transform="translate(16 17) scale(1)">
        <path d="M0 -9 L2.7 -2.7 L9 0 L2.7 2.7 L0 9 L-2.7 2.7 L-9 0 L-2.7 -2.7 Z" />
      </g>
      <g transform="translate(7.5 7) scale(0.62)">
        <path d="M0 -9 L2.7 -2.7 L9 0 L2.7 2.7 L0 9 L-2.7 2.7 L-9 0 L-2.7 -2.7 Z" />
      </g>
      <g transform="translate(26.5 4.5) scale(0.42)">
        <path d="M0 -9 L2.7 -2.7 L9 0 L2.7 2.7 L0 9 L-2.7 2.7 L-9 0 L-2.7 -2.7 Z" />
      </g>
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        line-height: 1;
      }

      .triple-star {
        display: block;
      }
    `,
  ],
})
export class TripleStarComponent {}