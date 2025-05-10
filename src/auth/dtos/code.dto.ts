import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class RequestCodeDto {
  @IsEmail()
  @ApiProperty({
    description: '사용자 이메일',
    example: 'test@snu.ac.kr',
  })
  email: string;
}

export class VerifyCodeDto {
  @IsEmail()
  @ApiProperty({
    description: '사용자 이메일',
    example: 'test@snu.ac.kr',
  })
  email: string;
  @IsString()
  @Length(6, 6)
  @ApiProperty({
    description: '인증 코드',
    example: '123456',
  })
  code: string;
}
