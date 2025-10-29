export interface AddedProduct {
  id?: number | string;
  name: string;
  brand: string;
  price: number | null;
  category: string;
  product_type: string;
  rating?: number | null;
  image?: string;
  description?: string;
  stock?: number | null;
  source?: string;
}
