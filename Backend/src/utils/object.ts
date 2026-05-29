import { Document } from 'mongoose';

export const omitFields = <T extends Record<string, unknown>>(
  obj: T,
  fields: string[]
): Partial<T> => {
  const result = { ...obj };
  fields.forEach((field) => {
    delete result[field as keyof T];
  });
  return result;
};

export const toPlainObject = <T extends Document>(doc: T): T => {
  return doc.toObject() as T;
};

export const filterObject = <T extends Record<string, unknown>>(
  obj: T,
  allowedFields: string[]
): Partial<T> => {
  const result = {} as Partial<T>;
  allowedFields.forEach((field) => {
    if (field in obj) {
      result[field as keyof T] = obj[field as keyof T];
    }
  });
  return result;
};
