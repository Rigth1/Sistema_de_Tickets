import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAreaDto {
    @ApiProperty({ description: 'Nombre del área', example: 'Soporte Técnico' })
    @IsNotEmpty({ message: 'El nombre del área es obligatorio' })
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    name: string;

    @ApiProperty({ description: 'Descripción del área', example: 'Área encargada del soporte técnico' })
    @IsOptional()
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    description?: string;
}