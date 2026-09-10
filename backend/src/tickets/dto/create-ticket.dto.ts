import { IsNotEmpty, IsString, IsOptional, IsNumber, IsIn } from 'class-validator';

export class CreateTicketDto {
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @IsString({ message: 'El título debe ser una cadena de texto' })
  title: string;

  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  description: string;

  @IsOptional()
  @IsIn(['Baja', 'Media', 'Alta', 'Urgente'], { message: 'La prioridad no es válida' })
  priority?: string;

  @IsNotEmpty({ message: 'El ID del área es obligatorio' })
  @IsNumber({}, { message: 'El área debe ser un número válido' })
  area_id: number;
}