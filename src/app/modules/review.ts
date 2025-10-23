export interface Review {
    id?: number;
    userName: string;
    userImage: string;
    date: string;
    rating: number;
    comment: string;
    productId: number;
      status?: 'approved' | 'pending' | 'rejected';
      productName?: string;
}
