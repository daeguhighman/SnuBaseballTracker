import { Injectable } from '@nestjs/common';
import { truncateAllTables } from '../seed/truncateAllTables';
import { seedUsers, seedUmpires } from '../seed/seedTestData';
@Injectable()
export class TestService {
  async clearAll() {
    await truncateAllTables();
  }

  async seedForUmpire() {
    const users = await seedUsers();
    await seedUmpires(users);
  }
}
