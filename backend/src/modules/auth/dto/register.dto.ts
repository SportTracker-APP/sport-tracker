import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  firstName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}