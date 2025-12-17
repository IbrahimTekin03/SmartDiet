import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../modules/acl/entities/role.entity';
import { Permission } from '../../modules/acl/entities/permission.entity';
import { User } from '../../modules/users/entities/user.entity';

export default class InitialSeeder0001 implements Seeder {
  track = true;

  public async run(dataSource: DataSource, _factoryManager: SeederFactoryManager): Promise<void> {
    const roleRepository = dataSource.getRepository(Role);
    const permissionRepository = dataSource.getRepository(Permission);
    const userRepository = dataSource.getRepository(User);

    // Permissions
    const basePermissions: Array<Partial<Permission>> = [
      { name: 'user.create', description: 'Kullanıcı oluşturma', group: 'user' },
      { name: 'user.read', description: 'Kullanıcı görüntüleme', group: 'user' },
      { name: 'user.update', description: 'Kullanıcı güncelleme', group: 'user' },
      { name: 'user.delete', description: 'Kullanıcı silme', group: 'user' },
      { name: 'role.create', description: 'Rol oluşturma', group: 'role' },
      { name: 'role.read', description: 'Rol görüntüleme', group: 'role' },
      { name: 'role.update', description: 'Rol güncelleme', group: 'role' },
      { name: 'role.delete', description: 'Rol silme', group: 'role' },
    ];

    const existingPermissions = await permissionRepository.find();
    const existingPermissionNames = new Set(existingPermissions.map((p) => p.name));
    const newPermissions = basePermissions.filter((p) => !existingPermissionNames.has(p.name!));
    if (newPermissions.length > 0) {
      await permissionRepository.save(newPermissions);
    }

    const allPermissions = await permissionRepository.find();

    // Roles
    const adminRole = await roleRepository.findOne({ where: { name: 'admin' }, relations: ['permissions'] });
    const userRole = await roleRepository.findOne({ where: { name: 'user' }, relations: ['permissions'] });

    let ensuredAdminRole = adminRole;
    if (!ensuredAdminRole) {
      ensuredAdminRole = roleRepository.create({ name: 'admin', description: 'Sistem yöneticisi', permissions: allPermissions });
      ensuredAdminRole = await roleRepository.save(ensuredAdminRole);
    } else if (!ensuredAdminRole.permissions || ensuredAdminRole.permissions.length !== allPermissions.length) {
      ensuredAdminRole.permissions = allPermissions;
      ensuredAdminRole = await roleRepository.save(ensuredAdminRole);
    }

    if (!userRole) {
      const readPermissions = allPermissions.filter((p) => p.name.endsWith('.read'));
      await roleRepository.save({ name: 'user', description: 'Standart kullanıcı', permissions: readPermissions });
    }

    // Admin user
    const adminUser = await userRepository.findOne({ where: { email: 'admin@example.com' }, relations: ['roles'] });
    if (!adminUser) {
      const created = userRepository.create({
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@example.com',
        phone_number: '+905555555555',
        roles: [ensuredAdminRole!],
        password_hash: 'admin123',
        is_active: true,
        is_verified: true,
        verification_code: '000000',
        last_login: new Date(),

      });
      await userRepository.save(created);
    } else {
      const hasAdminRole = adminUser.roles?.some((r) => r.name === 'admin');
      if (!hasAdminRole) {
        adminUser.roles = [...(adminUser.roles || []), ensuredAdminRole!];
        await userRepository.save(adminUser);
      }
    }
  }
} 