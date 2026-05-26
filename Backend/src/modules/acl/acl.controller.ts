import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AclService } from './acl.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { Permissions } from './decorators/permissions.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseDto } from '@/common/dto/response.dto';
import { I18nService } from 'nestjs-i18n';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@ApiTags('acl')
@Controller('acl')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AclController {
  constructor(
    private readonly aclService: AclService,
    private readonly i18n: I18nService,
  ) {}

  @Get('roles')
  @Permissions('role.read')
  @ApiOperation({ summary: 'Tüm rolleri listele' })
  @ApiResponse({
    status: 200,
    description: 'Roller başarıyla listelendi',
    type: ResponseDto,
  })
  async findAllRoles() {
    const roles = await this.aclService.findAllRoles();
    return ResponseDto.success('', roles);
  }

  @Get('roles/:id')
  @Permissions('role.read')
  @ApiOperation({ summary: 'ID ile rol getir' })
  @ApiResponse({
    status: 200,
    description: 'Rol başarıyla getirildi',
    type: ResponseDto,
  })
  async findRoleById(@Param('id') id: string) {
    const role = await this.aclService.findRoleById(id);
    return ResponseDto.success('', role);
  }

  @Post('roles')
  @Permissions('role.create','role.read')
  @ApiOperation({ summary: 'Yeni rol oluştur' })
  @ApiResponse({
    status: 201,
    description: 'Rol başarıyla oluşturuldu',
    type: ResponseDto,
  })
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.aclService.createRole(createRoleDto);
    const message = await this.i18n.translate('common.role.created');
    return ResponseDto.success(message, role);
  }

  @Put('roles/:id')
  @Permissions('role.update')
  @ApiOperation({ summary: 'Rol güncelle' })
  @ApiResponse({
    status: 200,
    description: 'Rol başarıyla güncellendi',
    type: ResponseDto,
  })
  async updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const role = await this.aclService.updateRole(id, updateRoleDto);
    const message = await this.i18n.translate('common.role.updated');
    return ResponseDto.success(message, role);
  }

  @Delete('roles/:id')
  @Permissions('role.delete')
  @ApiOperation({ summary: 'Rol sil' })
  @ApiResponse({
    status: 200,
    description: 'Rol başarıyla silindi',
    type: ResponseDto,
  })
  async deleteRole(@Param('id') id: string) {
    await this.aclService.deleteRole(id);
    const message = await this.i18n.translate('common.role.deleted');
    return ResponseDto.success(message);
  }

  @Get('permissions')
  @Permissions('role.read')
  @ApiOperation({ summary: 'Tüm izinleri listele' })
  @ApiResponse({
    status: 200,
    description: 'İzinler başarıyla listelendi',
    type: ResponseDto,
  })
  async findAllPermissions() {
    const permissions = await this.aclService.findAllPermissions();
    return ResponseDto.success('', permissions);
  }

  @Get('permissions/:id')
  @Permissions('role.read')
  @ApiOperation({ summary: 'ID ile izin getir' })
  @ApiResponse({
    status: 200,
    description: 'İzin başarıyla getirildi',
    type: ResponseDto,
  })
  async findPermissionById(@Param('id') id: string) {
    const permission = await this.aclService.findPermissionById(id);
    return ResponseDto.success('', permission);
  }

  @Post('permissions')
  @Permissions('role.update')
  @ApiOperation({ summary: 'Yeni izin oluştur' })
  @ApiResponse({
    status: 201,
    description: 'İzin başarıyla oluşturuldu',
    type: ResponseDto,
  })
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    const permission = await this.aclService.createPermission(createPermissionDto);
    const message = await this.i18n.translate('common.permission.created');
    return ResponseDto.success(message, permission);
  }

  @Put('permissions/:id')
  @Permissions('role.update')
  @ApiOperation({ summary: 'İzin güncelle' })
  @ApiResponse({
    status: 200,
    description: 'İzin başarıyla güncellendi',
    type: ResponseDto,
  })
  async updatePermission(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    const permission = await this.aclService.updatePermission(id, updatePermissionDto);
    const message = await this.i18n.translate('common.permission.updated');
    return ResponseDto.success(message, permission);
  }

  @Delete('permissions/:id')
  @Permissions('role.update')
  @ApiOperation({ summary: 'İzin sil' })
  @ApiResponse({
    status: 200,
    description: 'İzin başarıyla silindi',
    type: ResponseDto,
  })
  async deletePermission(@Param('id') id: string) {
    await this.aclService.deletePermission(id);
    const message = await this.i18n.translate('common.permission.deleted');
    return ResponseDto.success(message);
  }

  @Post('roles/:roleId/permissions')
  @Permissions('role.update')
  @ApiOperation({ summary: 'Role izin ekle' })
  @ApiResponse({
    status: 200,
    description: 'İzinler role başarıyla eklendi',
    type: ResponseDto,
  })
  async addPermissionsToRole(
    @Param('roleId') roleId: string,
    @Body() data: { permissionIds: string[] },
  ) {
    const role = await this.aclService.addPermissionsToRole(
      roleId,
      data.permissionIds,
    );
    return ResponseDto.success('İzinler role başarıyla eklendi', role);
  }

  @Delete('roles/:roleId/permissions')
  @Permissions('role.update')
  @ApiOperation({ summary: 'Rolden izin çıkar' })
  @ApiResponse({
    status: 200,
    description: 'İzinler rolden başarıyla çıkarıldı',
    type: ResponseDto,
  })
  async removePermissionsFromRole(
    @Param('roleId') roleId: string,
    @Body() data: { permissionIds: string[] },
  ) {
    const role = await this.aclService.removePermissionsFromRole(
      roleId,
      data.permissionIds,
    );
    return ResponseDto.success('İzinler rolden başarıyla çıkarıldı', role);
  }
} 