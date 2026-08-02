export interface CreditPage<T> {
  items: T[];
  total: number;
  lastPage: number;
  currentPage: number;
  size: number;
}