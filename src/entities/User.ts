
import { Column, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import { Record } from "./Record";

@Table
export class User extends Model {
  @PrimaryKey
  @Column
  id: number;

  @Column
  firstName: string;

  @Column
  lastName: string;

  @Column
  nickname: string;

  @HasMany(() => Record)
  records: Record[]
}