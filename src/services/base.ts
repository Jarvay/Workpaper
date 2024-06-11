import { BeanWithId, DBTableKey } from '../../cross/interface';
import { TableServiceRenderer } from '@/services/config-service';
import { generateId } from '../../cross/utils';

export enum UpsertType {
  Create,
  Update,
}

export abstract class BaseService<
  K extends DBTableKey,
  T extends BeanWithId,
> extends TableServiceRenderer<K, T> {
  abstract getKeyInDB(): K;

  async save(list: T[]) {
    return await this.setRows(this.getKeyInDB(), list);
  }

  async get() {
    return (await this.getRows(this.getKeyInDB())) || [];
  }

  async beforeCreate(item: T): Promise<T> {
    return item;
  }

  async beforeUpsert(item: T, type: UpsertType) {
    return item;
  }

  async afterUpsert(item: T, type: UpsertType) {}

  async create(item: T) {
    item = await this.beforeCreate(item);
    item = await this.beforeUpsert(item, UpsertType.Create);
    const list = await this.get();

    item.id = await generateId();
    list.push(item);
    const result = this.save(list);
    await this.afterUpsert(item, UpsertType.Create);
    return result;
  }

  async beforeUpdate(item: T): Promise<T> {
    return item;
  }

  async update(item: T) {
    item = await this.beforeUpdate(item);
    item = await this.beforeUpsert(item, UpsertType.Update);

    const list = await this.get();
    list.forEach((i, index) => {
      if (i.id === item.id) {
        list[index] = item;
      }
    });
    const result = this.save(list);
    await this.afterUpsert(item, UpsertType.Update);
    return result;
  }

  async delete(id: string) {
    let list = await this.get();
    list = list.filter((item) => item.id !== id);
    return this.save(list);
  }

  async getById(id: string) {
    const list = await this.get();
    return list.find((item) => item.id === id);
  }
}
