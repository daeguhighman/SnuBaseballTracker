import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  Matches,
} from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: '이메일 형식이 올바르지 않습니다.' })
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: '하나 이상의 대문자를 포함해야 합니다.' })
  @Matches(/[a-z]/, { message: '하나 이상의 소문자를 포함해야 합니다.' })
  @Matches(/[0-9]/, { message: '하나 이상의 숫자를 포함해야 합니다.' })
  @Matches(/[@$!%*?&]/, {
    message: '하나 이상의 특수문자를 포함해야 합니다.',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  nickname: string;

  @IsString()
  @IsNotEmpty()
  verificationToken: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
