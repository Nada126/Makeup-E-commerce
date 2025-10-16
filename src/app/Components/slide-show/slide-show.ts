import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-slide-show',
  imports: [],
  templateUrl: './slide-show.html',
  styleUrl: './slide-show.css'
})

export class SlideShow implements OnInit, OnDestroy {
  src: string[] = [
    'images/benefit.png',
    'images/dior.png',
    'images/essie.jpg',
    'images/fenty.jpg',
    'images/marcilla.png',
    'images/maybelline.jpg',
    'images/mineral-lipstick-maias.jpg',
    'images/pacifica.jpg',
    'images/revlon.png',
    'images/stila.png'
  ];

  idx: number = 0;
  imgSrc: string = this.src[0];
  timer: any = null;

  ngOnInit() {
    this.startSlide();
  }

  ngOnDestroy() {
    this.stopSlide();
  }

  next() {
    this.idx = (this.idx + 1) % this.src.length;
    this.imgSrc = this.src[this.idx];
  }

  prev() {
    this.idx = (this.idx - 1 + this.src.length) % this.src.length;
    this.imgSrc = this.src[this.idx];
  }

  startSlide() {
    this.stopSlide(); // prevent duplicate intervals
    this.timer = setInterval(() => this.next(), 3000); // auto-slide every 3 seconds
  }

  stopSlide() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // optional: restart slide show after hover ends
  onMouseEnter() {
    this.stopSlide();
  }

  onMouseLeave() {
    this.startSlide();
  }
}
