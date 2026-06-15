export type TransactionType = 'income' | 'expense' | 'shared';
export type CategoryType = 'income' | 'expense';
export type SharedSplitMode = 'equal' | 'amount' | 'percentage';

export type Category = {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
};

export type PublicUser = {
  uid: string;
  nombre: string;
  nombreLower: string;
};

export type SharedParticipant = {
  uid: string;
  nombre: string;
  amount: number;
  percentage: number;
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
  participantUids?: string[];
  participants?: SharedParticipant[];
  payerUid?: string;
  totalAmount?: number;
  splitMode?: SharedSplitMode;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TransactionInput = Omit<
  Transaction,
  'id' | 'userId' | 'imageUrl' | 'createdAt' | 'updatedAt'
>;
