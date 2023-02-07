import {Column, Model, Table, HasMany, BelongsTo, ForeignKey} from "sequelize-typescript";
import {User} from "./User";
import {DataTypes} from "sequelize";

@Table
export class Record extends Model {
    @ForeignKey(() => User)
    @Column
    userId: number

    @BelongsTo(() => User)
    user: User;

    @Column({
        type: DataTypes.STRING,
        allowNull: false
    })
    fullMessage: string;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false
    })
    workTime: number;

    @Column({
        type: DataTypes.DATE,
        allowNull: false
    })
    forwardDate: Date;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false
    })
    forwardDay: number

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false
    })
    forwardMonth: number

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false
    })
    forwardYear: number
}