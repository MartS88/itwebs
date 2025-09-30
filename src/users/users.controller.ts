// users.controller.ts

// Nest js
import {
  Controller,
  Patch,
  Get,
  UseGuards,
  NotFoundException,
  Body,
} from '@nestjs/common';

// Guards
import { JwtAuthGuard } from '../auth/guards';

// Services
import { UsersService } from './users.service';

// Dto
import { UpdateUsernameDto } from './dto/update-username.dto';
import { UserId } from '../common/decorators';

// Routes
import { USERS } from './users.routes';

@UseGuards(JwtAuthGuard)
@Controller(USERS.CONTROLLER)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(USERS.ROUTES.GET)
  async getUser(@UserId() userId: number) {
    const user = await this.usersService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }
    return { user: user };
  }

  @Patch(USERS.ROUTES.UPDATE_USERNAME)
  async updateUsername(
    @Body() dto: UpdateUsernameDto,
    @UserId() userId: number,
  ) {
    const updateUsername = await this.usersService.updateUsername(userId, dto);
    return { data: updateUsername };
  }
}
