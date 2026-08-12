import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-title',
  template: `
    <div class="app-page-title">
      <div class="page-title-wrapper">
        <div class="page-title-heading">
          <div class="page-title-icon">
            <i class="icon {{ icon }}"></i>
          </div>
          <div>
            {{ heading }}
            <div class="page-title-subheading">{{ subheading }}</div>
          </div>
        </div>
        <div class="page-title-actions">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class PageTitleComponent {
  @Input() heading = '';
  @Input() subheading = '';
  @Input() icon = '';
}