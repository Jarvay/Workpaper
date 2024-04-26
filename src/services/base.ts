import { BeanWithId, DBData, DBTableKey } from '../../cross/interface';
import { TableServiceRenderer } from '@/services/config-service';

export abstract class BaseService<
  K extends DBTableKey,
  T extends BeanWithId,
> extends TableServiceRenderer<K, T> {
  abstract getKeyInDB(): K;

  async save(list: T[]) {
    await this.setRows(this.getKeyInDB(), list);
  }

  async get() {
    return (await this.getRows(this.getKeyInDB())) || [];
  }

  async create(item: T) {
    const list = await this.get();
    item.id = String(
      Date.now() + '' + Number(Math.random().toFixed(8)) * 100000000,
    );
    list.push(item);
    return this.save(list);
  }

  async update(item: T) {
    const list = await this.get();
    list.forEach((i, index) => {
      if (i.id === item.id) {
        list[index] = item;
      }
    });
    return await this.save(list);
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
