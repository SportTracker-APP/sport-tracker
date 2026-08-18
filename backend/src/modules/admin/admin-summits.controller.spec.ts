import { GUARDS_METADATA } from '@nestjs/common/constants';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminSummitsController } from './admin-summits.controller';
import { AdminGuard } from './guards/admin.guard';

describe('AdminSummitsController security', () => {
  it('applies authentication before the database-backed admin authorization', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, AdminSummitsController),
    ).toEqual([JwtAuthGuard, AdminGuard]);
  });
});
