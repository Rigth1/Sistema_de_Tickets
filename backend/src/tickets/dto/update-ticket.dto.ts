import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { CreateTicketDto } from './create-ticket.dto.js';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @ApiPropertyOptional({ 
    description: 'Nota o explicación de la gestión realizada al actualizar el ticket', 
    example: 'Se contactó al cliente y se solicitó reiniciar el módem.' 
  })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ 
    description: 'Indica si el comentario es una nota interna oculta para el cliente', 
    example: false 
  })
  @IsBoolean() 
  @IsOptional()
  is_internal?: boolean;

  @ApiPropertyOptional({ 
    description: 'ID del usuario al que se reasignará el ticket', 
    example: 2 
  })
  @IsNumber()
  @IsOptional()
  assigned_to?: number | null;

  @ApiPropertyOptional({ 
    description: 'Nuevo estado del ticket', 
    example: 'En Proceso' 
  })
  @IsString()
  @IsOptional()
  status?: string;
}