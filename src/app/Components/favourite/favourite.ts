import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FavoriteService} from '../../Services/favourite-service';
import { FavouriteItem } from '../../models/favourite-item';

@Component({
  selector: 'app-favourites',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favourite.html',
  styleUrls: ['./favourite.css']
})
export class Favourites implements OnInit {
  items: FavouriteItem[] = [];

  constructor(public router: Router, public favService: FavoriteService) {}

  ngOnInit(): void {
    this.items = this.favService.getItems();
    this.favService.items$.subscribe(items => {
      this.items = items || [];
    });
  }

  remove(item: FavouriteItem) {
    this.favService.removeItem(item.productId);
  }

  clearAll() {
    this.favService.clearFavorites();
  }

  goToProduct(item: FavouriteItem) {
    if (item.product && item.product.id != null) {
      this.router.navigate(['/product', item.product.id], { state: { product: item.product }});
    } else {
      // fallback: try productId
      this.router.navigate(['/product', item.productId]);
    }
  }

  get count() {
    return this.items.length;
  }
}
