import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { AclService } from './acl.service';
import { AclController } from './acl.controller';
import { User } from '../users/entities/user.entity';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, User])],
  controllers: [AclController],
  providers: [AclService, RolesGuard, PermissionsGuard],
  exports: [AclService, TypeOrmModule],
})
export class AclModule {} 