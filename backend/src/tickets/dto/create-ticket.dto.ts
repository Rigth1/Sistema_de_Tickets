import { IsNotEmpty, IsString, IsOptional, IsNumber, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
    @ApiProperty({ description: 'Título del ticket', example: 'Error al iniciar sesión' })
    @IsNotEmpty({ message: 'El título es obligatorio' })
    @IsString({ message: 'El título debe ser una cadena de texto' })
    title: string;

    @ApiProperty({ description: 'Descripción del ticket', example: 'No puedo iniciar sesión en el sistema' })
    @IsNotEmpty({ message: 'La descripción es obligatoria' })
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    description: string;

    @ApiProperty({ description: 'Prioridad del ticket', example: 'Media', required: false })
    @IsOptional()
    @IsIn(['Baja', 'Media', 'Alta', 'Urgente'], { message: 'La prioridad no es válida' })
    priority?: string;

    @ApiProperty({ description: 'ID del área', example: 1 })
    @IsNotEmpty({ message: 'El ID del área es obligatorio' })
    @IsNumber({}, { message: 'El área debe ser un número válido' })
    area_id: number;
}