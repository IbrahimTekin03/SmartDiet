import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from '../acl/entities/role.entity';
import { Permission } from '../acl/entities/permission.entity';
import { AclModule } from '../acl/acl.module';

import { UserAssignedDietitian } from './entities/user-assigned-dietitian.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Permission, UserAssignedDietitian]),AclModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule.forFeature([User, UserAssignedDietitian])],
})
export class UsersModule {} 