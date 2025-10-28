import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-slide-show',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slide-show.html',
  styleUrl: './slide-show.css'
})
export class SlideShow implements OnInit, OnDestroy {
  slides: { src: string; brand: string }[] = [
    { src: 'images/benefit.png', brand: 'benefit' },
    { src: 'images/dior.png', brand: 'dior' },
    { src: 'images/essie.jpg', brand: 'essie' },
    { src: 'images/fenty.jpg', brand: 'fenty' },
    { src: 'images/marcilla.png', brand: 'marcilla' },
    { src: 'images/maybelline.jpg', brand: 'maybelline' },
    { src: 'images/mineral-lipstick-maias.jpg', brand: 'maias' },
    { src: 'images/pacifica.jpg', brand: 'pacifica' },
    { src: 'images/revlon.png', brand: 'revlon' },
    { src: 'images/stila.png', brand: 'stila' }
  ];

  idx = 0;
  currentSlide = this.slides[0];
  private timer: any = null;

  constructor(private router: Router) {}

  ngOnInit(): void { this.startSlide(); }
  ngOnDestroy(): void { this.stopSlide(); }

  next(): void {
    this.idx = (this.idx + 1) % this.slides.length;
    this.currentSlide = this.slides[this.idx];
  }

  prev(): void {
    this.idx = (this.idx - 1 + this.slides.length) % this.slides.length;
    this.currentSlide = this.slides[this.idx];
  }

  startSlide(): void {
    this.stopSlide();
    this.timer = setInterval(() => this.next(), 3000);
  }

  stopSlide(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  goToBrand(): void {
    this.router.navigate(['/brand', this.currentSlide.brand]);
  }

  onMouseEnter(): void { this.stopSlide(); }
  onMouseLeave(): void { this.startSlide(); }
}
