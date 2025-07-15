import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  email: string;
}

export class ResetPasswordDto {
  @IsString({ message: '토큰은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '토큰을 입력해주세요.' })
  token: string;

  @IsString({ message: '새 비밀번호는 문자열이어야 합니다.' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  newPassword: string;
}
