const fs = require('fs');
const dayjs = require('dayjs');
const path = require('path');

const className = `Migration_${dayjs().format('YYYYMMDD_HHmm')}`;
const content = `
import { IMigration } from './index';

export class ${className} implements IMigration {
  id(): string {
    return '${className}';
  }
  run() {
    
  }
}`;

fs.writeFileSync(
  path.join('electron/main/migrations', `${className.toLowerCase()}.ts`),
  content,
);
