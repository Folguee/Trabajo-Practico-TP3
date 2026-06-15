export type TransactionType = 'income' | 'expense' | 'shared';
export type CategoryType = 'income' | 'expense';

export type Category = {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
};

export type SharedTransactionDetail = {
  total: number;
  pagadoPorMi: number;
  pagadoPorAmigo: number;
  amigo?: {
    uid?: string;
    nombre?: string;
  };
};

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  title: string;
  date: Date;
  categoryId: string;
  categoryName: string;
  note?: string;
  imagePath?: string | null;
  imageUrl?: string;
  userId: string;
  creatorUid?: string;
  parteCreador?: number;
  parteAmigo?: number;
  detalleCompartido?: SharedTransactionDetail;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TransactionInput = Omit<
  Transaction,
  'id' | 'userId' | 'imageUrl' | 'createdAt' | 'updatedAt'
>;
