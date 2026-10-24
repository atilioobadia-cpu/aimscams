import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'aims-money-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="money-input">
      <span class="currency">TZS</span>
      <input 
        type="text" 
        [value]="displayValue"
        (input)="onInput($event)"
        (blur)="onBlur()"
        [placeholder]="placeholder"
      />
    </div>
  `,
  styles: [`
    .money-input {
      display: flex;
      align-items: center;
      border: 1px solid var(--line-strong);
      border-radius: 7px;
      overflow: hidden;
    }
    .currency {
      padding: 8px 10px;
      background: var(--paper);
      border-right: 1px solid var(--line-strong);
      font-size: 12px;
      color: var(--ink-faint);
    }
    input {
      flex: 1;
      padding: 8px 10px;
      border: none;
      font-size: 13px;
      font-family: inherit;
    }
    input:focus {
      outline: 2px solid #cfe4dc;
    }
  `],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MoneyInputComponent),
    multi: true
  }]
})
export class MoneyInputComponent implements ControlValueAccessor {
  @Input() placeholder = '0';
  value: number = 0;
  displayValue = '';
  
  onChange: any = () => {};
  onTouched: any = () => {};
  
  writeValue(value: number): void {
    this.value = value || 0;
    this.displayValue = this.formatNumber(this.value);
  }
  
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/[^0-9]/g, '');
    this.value = parseInt(raw) || 0;
    this.displayValue = this.formatNumber(this.value);
    this.onChange(this.value);
  }
  
  onBlur(): void {
    this.onTouched();
  }
  
  private formatNumber(num: number): string {
    return num.toLocaleString('en-US');
  }
}
