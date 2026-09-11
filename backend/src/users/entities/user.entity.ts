import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Role } from './role.entity.js';
import { Area } from '../../areas/entities/area.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // select: false para que no se devuelva el hash de la contraseña al consultar un usuario
  password_hash: string;

  @Column({ default: 'Cliente' }) // cliente por defecto para que al registrarse un usuario no pueda asignarse un rol de administrador o soporte por error
  role_id: number;
  // relacion con role eager loading para que siempre que se consulte un usuario, se traiga su rol asociado
  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;
  // Relación con Area, un usuario puede pertenecer a muchas áreas y un área puede tener muchos usuarios cascade true para que al eliminar un usuario se eliminen sus relaciones con las áreas
  @ManyToMany(() => Area, (area) => area.users, { cascade: true })
  // JoinTable para relacionar la tabla intermedia user_areas con las columnas user_id y area_id
  @JoinTable({
    name: 'user_areas',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'area_id', referencedColumnName: 'id' },
  })
  areas: Area[];

  @CreateDateColumn()
  created_at: Date;
}