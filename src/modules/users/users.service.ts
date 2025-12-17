import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { Role } from '../acl/entities/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly i18n: I18nService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { roleIds, ...userData } = createUserDto;
    

    // Create user
    const user = this.userRepository.create({
      ...userData,
    });

    // Add roles if provided
    if (roleIds && roleIds.length > 0) {
      const roles = await this.roleRepository.findBy({ 
        id: In(roleIds) 
      });
      user.roles = roles;
    }

    return this.userRepository.save(user);
  }

  async findAll(paginationDto: PaginationDto): Promise<[User[], number]> {
    const { page, limit } = paginationDto;
    
    return this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['roles'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    
    if (!user) {
      throw new NotFoundException(
        await this.i18n.translate('common.user.not_found'),
      );
    }
    
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    });
  }

  async findByUsername(username: string): Promise<User> {
    return this.userRepository.findOne({
      where: { display_name: username },
      relations: ['roles'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const {roleIds, ...userData } = updateUserDto;
    
    // Find user
    const user = await this.findOne(id);
    
    // Update user data
    Object.assign(user, userData);
    
    
    // Update roles if provided
    if (roleIds) {
      const roles = await this.roleRepository.findBy({ 
        id: In(roleIds) 
      });
      user.roles = roles;
    }
    
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softRemove(user);
  }

} 