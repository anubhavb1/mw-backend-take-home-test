import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ProviderLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  vrm: string;

  @Column()
  requestDate: Date;

  @Column()
  requestDuration: number;

  @Column()
  requestUrl: string;

  @Column()
  responseCode: number;

  @Column({ nullable: true })
  errorCode?: string;

  @Column({ nullable: true })
  errorMessage?: string;

  @Column({ nullable: true })
  provider?: string;
}
