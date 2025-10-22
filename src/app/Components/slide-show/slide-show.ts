import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-slide-show',
  imports: [CommonModule],
  templateUrl: './slide-show.html',
  styleUrls: ['./slide-show.css']
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
  timer: any = null;

  constructor(private router: Router) {}

  ngOnInit() {
    this.startSlide();
  }

  ngOnDestroy() {
    this.stopSlide();
  }

  next() {
    this.idx = (this.idx + 1) % this.slides.length;
    this.currentSlide = this.slides[this.idx];
  }

  prev() {
    this.idx = (this.idx - 1 + this.slides.length) % this.slides.length;
    this.currentSlide = this.slides[this.idx];
  }

  startSlide() {
    this.stopSlide();
    this.timer = setInterval(() => this.next(), 4000);
  }

  stopSlide() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  goToBrand() {
    this.router.navigate(['/brand', this.currentSlide.brand]);
  }

  onMouseEnter() {
    this.stopSlide();
  }

  onMouseLeave() {
    this.startSlide();
  }
}
