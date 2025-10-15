export interface Product {
  id: number;
  name: string;
  brand: string;
  price: number | string;
  rating?: number | string;
  image_link: string;
  product_type: string;
  product_category: string;
}
