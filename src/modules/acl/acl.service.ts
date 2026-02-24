import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { I18nService } from 'nestjs-i18n';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AclService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly i18n: I18nService,
  ) {}

  // Role methods
  async createRole(createRoleDto: CreateRoleDto | Partial<Role>): Promise<Role> {
    const role = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  async findAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['permissions'],
    });
  }

  async findRoleById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(
        await this.i18n.translate('common.role.not_found'),
      );
    }

    return role;
  }

  async findRoleByName(name: string): Promise<Role> {
    return this.roleRepository.findOne({ 
      where: { name },
      relations: ['permissions'] 
    });
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto | Partial<Role>): Promise<Role> {
    await this.roleRepository.update(id, updateRoleDto);
    return this.findRoleById(id);
  }

  async deleteRole(id: string): Promise<boolean> {
    const result = await this.roleRepository.delete(id);
    return result.affected > 0;
  }



  // Permission methods
  async createPermission(createPermissionDto: CreatePermissionDto | Partial<Permission>): Promise<Permission> {
    const permission = this.permissionRepository.create(createPermissionDto);
    return this.permissionRepository.save(permission);
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find();
  }

  async findPermissionById(id: string): Promise<Permission> {
    return this.permissionRepository.findOne({ where: { id } });
  }

  async findPermissionByName(name: string): Promise<Permission> {
    return this.permissionRepository.findOne({ where: { name } });
  }

  async updatePermission(id: string, updatePermissionDto: UpdatePermissionDto | Partial<Permission>): Promise<Permission> {
    await this.permissionRepository.update(id, updatePermissionDto);
    return this.findPermissionById(id);
  }

  async deletePermission(id: string): Promise<boolean> {
    const result = await this.permissionRepository.delete(id);
    return result.affected > 0;
  }

  async addPermissionsToRole(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.findRoleById(roleId);
    const permissions = await this.permissionRepository.findBy({ id: In(permissionIds) });
    
    role.permissions = [...role.permissions, ...permissions];
    return this.roleRepository.save(role);
  }

  async removePermissionsFromRole(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.findRoleById(roleId);
    
    role.permissions = role.permissions.filter(
      permission => !permissionIds.includes(permission.id)
    );
    
    return this.roleRepository.save(role);
  }

  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user || !user.roles || user.roles.length === 0) {
      return false;
    }

    return user.roles.some(role => 
      role.permissions.some(permission => permission.name === permissionName)
    );
  }
} 