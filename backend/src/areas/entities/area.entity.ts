import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';

@Entity('areas')
export class Area {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToMany('User', (user: any) => user.areas)
  users: any[];
}