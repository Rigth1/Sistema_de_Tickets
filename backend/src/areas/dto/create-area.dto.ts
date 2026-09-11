import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateAreaDto {
  @IsNotEmpty({ message: 'El nombre del área es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  name: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  description?: string;
}