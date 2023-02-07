import { Column, Model, Table, HasMany, BelongsTo, ForeignKey } from "sequelize-typescript";
import { User } from "./User";

@Table
export class Record extends Model {
  @ForeignKey(() => User)
  @Column
  userId: number

  @BelongsTo(() => User)
  user: User;

  @Column
  fullMessage: string;

  @Column
  workTime: number;

  @Column
  date: string;
}