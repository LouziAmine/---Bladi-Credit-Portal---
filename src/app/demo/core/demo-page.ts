import { CreditPage } from '../../core/models/page.model';

export function paginate<T>(all: T[], page: number, size: number): CreditPage<T> {
  const total = all.length;

  const lastPage = size > 0 ? Math.ceil(total / size) : 0;
  const start = (page - 1) * size;
  const items = size > 0 ? all.slice(start, start + size) : [];
  return { items, total, lastPage, currentPage: page, size };
}
