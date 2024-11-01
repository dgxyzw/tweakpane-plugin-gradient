import { View } from '@tweakpane/core';

export class GradientView implements View {
  public readonly document: Document;

  public readonly element: HTMLElement;

  public readonly rangeElement: HTMLDivElement;

  public readonly colorPickerElement: HTMLDivElement;

  public readonly alphaPickerElement: HTMLDivElement;

  public readonly alphaPickerSliderElement: HTMLDivElement;

  public readonly alphaPickerInputElement: HTMLDivElement;

  public readonly timePickerElement: HTMLDivElement;

  constructor(document: Document) {
    this.document = document;
    this.element = this.document.createElement('div');

    this.element = this.document.createElement('div');
    this.element.classList.add('tp-gradient');
    this.element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    this.rangeElement = this.document.createElement('div');
    this.rangeElement.classList.add('tp-gradient__range');
    this.element.appendChild(this.rangeElement);

    this.colorPickerElement = document.createElement('div');
    this.colorPickerElement.classList.add('tp-gradient__color-picker');
    this.element.appendChild(this.colorPickerElement);

    this.alphaPickerElement = document.createElement('div');
    this.alphaPickerSliderElement = document.createElement('div');
    this.alphaPickerInputElement = document.createElement('div');
    this.alphaPickerElement.classList.add('tp-gradient__alpha-picker');
    this.alphaPickerSliderElement.classList.add('tp-gradient__alpha-picker-slider');
    this.alphaPickerInputElement.classList.add('tp-gradient__alpha-picker-input');
    this.element.appendChild(this.alphaPickerElement);
    this.alphaPickerElement.appendChild(this.alphaPickerSliderElement);
    this.alphaPickerElement.appendChild(this.alphaPickerInputElement);

    this.timePickerElement = document.createElement('div');
    this.timePickerElement.classList.add('tp-gradient__time-picker');
    this.element.appendChild(this.timePickerElement);
  }
}
