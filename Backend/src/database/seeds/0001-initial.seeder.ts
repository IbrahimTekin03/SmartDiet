import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Role } from '../../modules/acl/entities/role.entity';
import { Permission } from '../../modules/acl/entities/permission.entity';
import { User } from '../../modules/users/entities/user.entity';

export default class InitialSeeder0001 implements Seeder {
  track = true;

  public async run(dataSource: DataSource, _factoryManager: SeederFactoryManager): Promise<void> {
    const roleRepository = dataSource.getRepository(Role);
    const permissionRepository = dataSource.getRepository(Permission);
    const userRepository = dataSource.getRepository(User);

    const basePermissions: Array<Partial<Permission>> = [
      { name: 'user.create', description: 'Kullanici olusturma', group: 'user' },
      { name: 'user.read', description: 'Kullanici goruntuleme', group: 'user' },
      { name: 'user.update', description: 'Kullanici guncelleme', group: 'user' },
      { name: 'user.delete', description: 'Kullanici silme', group: 'user' },
      { name: 'role.create', description: 'Rol olusturma', group: 'role' },
      { name: 'role.read', description: 'Rol goruntuleme', group: 'role' },
      { name: 'role.update', description: 'Rol guncelleme', group: 'role' },
      { name: 'role.delete', description: 'Rol silme', group: 'role' },
    ];

    const existingPermissions = await permissionRepository.find();
    const existingPermissionNames = new Set(existingPermissions.map((p) => p.name));
    const newPermissions = basePermissions.filter((p) => !existingPermissionNames.has(p.name!));
    if (newPermissions.length > 0) {
      await permissionRepository.save(newPermissions);
    }

    const allPermissions = await permissionRepository.find();
    const readPermissions = allPermissions.filter((p) => p.name.endsWith('.read'));

    let ensuredAdminRole = await roleRepository.findOne({
      where: { name: 'admin' },
      relations: ['permissions'],
    });
    if (!ensuredAdminRole) {
      ensuredAdminRole = roleRepository.create({
        name: 'admin',
        description: 'Sistem yoneticisi',
        permissions: allPermissions,
      });
      ensuredAdminRole = await roleRepository.save(ensuredAdminRole);
    } else if (!ensuredAdminRole.permissions || ensuredAdminRole.permissions.length !== allPermissions.length) {
      ensuredAdminRole.permissions = allPermissions;
      ensuredAdminRole = await roleRepository.save(ensuredAdminRole);
    }

    const roleDefinitions = [
      { name: 'user', description: 'Standart kullanici' },
      { name: 'client', description: 'Danisan kullanici' },
      { name: 'dietitian', description: 'Diyetisyen kullanici' },
    ];

    for (const roleDef of roleDefinitions) {
      const role = await roleRepository.findOne({ where: { name: roleDef.name } });
      if (!role) {
        await roleRepository.save({
          name: roleDef.name,
          description: roleDef.description,
          permissions: readPermissions,
        });
      }
    }

    const adminUser = await userRepository.findOne({
      where: { email: 'admin@example.com' },
      relations: ['roles'],
    });
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

    const mertUser = await userRepository.findOne({
      where: { email: 'mertb2627@gmail.com' },
      relations: ['roles'],
    });
    if (mertUser && ensuredAdminRole) {
      const hasAdminRole = mertUser.roles?.some((r) => r.name === 'admin');
      if (!hasAdminRole) {
        mertUser.roles = [...(mertUser.roles || []), ensuredAdminRole];
        await userRepository.save(mertUser);
      }
    }
  }
}
