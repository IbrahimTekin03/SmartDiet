import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ResponseDto } from '@/common/dto/response.dto';
import { User } from './entities/user.entity';
import { I18nService } from 'nestjs-i18n';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../acl/guards/roles.guard';
import { Roles } from '../acl/decorators/roles.decorator';
import { Permissions } from '../acl/decorators/permissions.decorator';
import { PermissionsGuard } from '../acl/guards/permissions.guard';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard,PermissionsGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly i18n: I18nService,
  ) {}

  @Post()
  @Permissions('user.create')
  @ApiOperation({ summary: 'Yeni kullanıcı oluştur' })
  @ApiResponse({
    status: 201,
    description: 'Kullanıcı başarıyla oluşturuldu',
    type: ResponseDto,
  })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    const message = await this.i18n.translate('common.user.created');
    return ResponseDto.success(message, user);
  }

  @Get()
  @Permissions('user.read')
  @ApiOperation({ summary: 'Tüm kullanıcıları listele' })
  @ApiResponse({
    status: 200,
    description: 'Kullanıcılar başarıyla listelendi',
    type: ResponseDto,
  })
  async findAll(@Query() paginationDto: PaginationDto) {
    const [users, total] = await this.usersService.findAll(paginationDto);
    return ResponseDto.success('', {
      items: users,
      total,
      page: paginationDto.page,
      limit: paginationDto.limit,
    });
  }

  @Get(':id')
  @Permissions('user.read')
  @ApiOperation({ summary: 'ID ile kullanıcı getir' })
  @ApiResponse({
    status: 200,
    description: 'Kullanıcı başarıyla getirildi',
    type: ResponseDto,
  })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return ResponseDto.success('', user);
  }

  @Patch(':id')
  @Permissions('user.update')
  @ApiOperation({ summary: 'Kullanıcı güncelle' })
  @ApiResponse({
    status: 200,
    description: 'Kullanıcı başarıyla güncellendi',
    type: ResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    const message = await this.i18n.translate('common.user.updated');
    return ResponseDto.success(message, user);
  }

  @Delete(':id')
  @Permissions('user.delete')
  @ApiOperation({ summary: 'Kullanıcı sil' })
  @ApiResponse({
    status: 200,
    description: 'Kullanıcı başarıyla silindi',
    type: ResponseDto,
  })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    const message = await this.i18n.translate('common.user.deleted');
    return ResponseDto.success(message);
  }
} 