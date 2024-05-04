import { BeanWithId, DBTableKey } from '../../cross/interface';
import { TableServiceRenderer } from '@/services/config-service';
import { Md5 } from '@smithy/md5-js';

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

  async beforeCreate(item: T): Promise<T> {
    return item;
  }

  async create(item: T) {
    item = await this.beforeCreate(item);
    const list = await this.get();

    const md5 = new Md5();
    const random = (Math.random() * 100000000).toFixed(0);
    md5.update(Date.now() + random);

    const uint8Array = await md5.digest();
    const strArr: string[] = [];
    uint8Array.forEach((x) => {
      strArr.push(('00' + x.toString(16)).slice(-2));
    });
    item.id = strArr.join('');
    list.push(item);
    return this.save(list);
  }

  async beforeUpdate(item: T): Promise<T> {
    return item;
  }

  async update(item: T) {
    item = await this.beforeUpdate(item);

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
