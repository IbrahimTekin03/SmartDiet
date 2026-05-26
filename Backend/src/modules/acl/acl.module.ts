import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { AclService } from './acl.service';
import { AclController } from './acl.controller';
import { User } from '../users/entities/user.entity';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { UserProfile } from '../users/entities/user.profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, User, UserProfile])],
  controllers: [AclController],
  providers: [AclService, RolesGuard, PermissionsGuard],
  exports: [AclService, TypeOrmModule],
})
export class AclModule {} 