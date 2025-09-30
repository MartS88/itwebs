import { JwtAuthGuard } from './jwt-auth.guard';
import { Reflector } from '@nestjs/core';

describe('JwtAuthGuard', () => {
  it('should be defined', () => {
    const reflector = new Reflector();
    expect(new JwtAuthGuard(reflector)).toBeDefined();
  });
});
