import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as CustomStrategy } from 'passport-custom';
import { AuthService } from '../auth.service';
import { I18nService } from 'nestjs-i18n';
import { Request } from 'express';

@Injectable()
export class LocalStrategy extends PassportStrategy(CustomStrategy, 'local') {
  constructor(
    private readonly authService: AuthService,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  async validate(req: Request): Promise<any> {
    const email = (req.body as any)?.email;
    const phoneNumber = (req.body as any)?.phone_number;
    const password = (req.body as any)?.password;

    // En az bir kimlik alanı gerekli
    const identifier = email || phoneNumber;
    if (!identifier) {
      const message = await this.i18n.translate('common.auth.invalid_credentials');
      throw new UnauthorizedException(message);
    }

    if (!password) {
      const message = await this.i18n.translate('common.auth.invalid_credentials');
      throw new UnauthorizedException(message);
    }

    const user = await this.authService.validateUser(identifier, password);
    if (!user) {
      const message = await this.i18n.translate('common.auth.invalid_credentials');
      throw new UnauthorizedException(message);
    }

    return user;
  }
}
