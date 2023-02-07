import {Injectable} from "@nestjs/common";
import {Command, Ctx, Hears, On, Start, Update} from "nestjs-telegraf";
import {User} from "./entities/User";
import {InjectModel} from "@nestjs/sequelize";
import {ConfigService} from "@nestjs/config";
import {Record} from "./entities/Record";
import {millisecondsToHours} from 'date-fns'
import {Markup} from "telegraf";

type ContextFromType = {
    id: number,
    is_bot: boolean,
    first_name: string,
    last_name: string,
    username: string,
    language_code: string
}

type ContextForwardFromType = {
    id: number,
    is_bot: boolean,
    first_name: string,
    username: string
}

const currentMonthKey = "📅 Получить время за текущий месяц"
const previousMonthKey = "📅 Получить время за прошлый месяц"


@Injectable()
@Update()
export class AppService {
    private readonly parentBotId: number;

    constructor(private configService: ConfigService,
                @InjectModel(User) private userModel: typeof User,
                @InjectModel(Record) private recordModel: typeof Record
    ) {
        this.parentBotId = parseInt(this.configService.get("PARENT_BOT_ID"), 10);
    }

    private jokePhrases = ["не пытайся меня обмануть =)", "очень смешно :D", "да-да-да...", "удачи ^_^", "дать инструкцию? :)", "это шутка?"];
    private goodPhrases = ['Понял.', 'Принял.', 'Спасибо.', 'Окей.', "Супер!", "Так держать! :)"]

    private getRandomJokePhrase = () => {
        return this.jokePhrases[Math.floor(Math.random() * this.jokePhrases.length)];
    };

    private getRandomGoodPhrase = () => {
        return this.goodPhrases[Math.floor(Math.random() * this.jokePhrases.length)];
    };

    private parseMessageToWorkTime(fullMessage: string): number {
        const second = 1000;
        const minute = second * 60;
        const hour = minute * 60;

        const dateString = fullMessage.split("online:").slice(-1)[0].split("👏🏻")[0];
        const [hours, minutes, seconds] = dateString.split(":");
        return +hours.trim() * hour + +minutes.trim() * minute + +seconds.trim() * second;
    }

    private parseMillisecondsToTime(workTime: any[]): string {
        let totalCount = 0
        for (const el of workTime) {
            totalCount += el.workTime
        }
        const ms = totalCount % 1000;
        totalCount = (totalCount - ms) / 1000;
        const secs = totalCount % 60;
        totalCount = (totalCount - secs) / 60;
        const mins = totalCount % 60;
        const hrs = (totalCount - mins) / 60;
        return hrs + ':' + mins + ':' + secs;
    }


    private keyboard = Markup.keyboard([
        [currentMonthKey],
        [previousMonthKey],
    ]).resize()
        // .oneTime()

    @Start()
    async newUserInit(@Ctx() ctx: any) {
        try {
            const from: ContextFromType = ctx.update.message.from;
            const user = {
                id: from.id,
                firstName: from.first_name,
                lastName: from.last_name,
                nickname: from.username,
                records: []
            };
            await this.userModel.upsert(user);
            await ctx.reply(
                `Привет, ${user.firstName}!`,
                this.keyboard
            );
            return
        } catch (e) {
            // console.log(e);
            return `Упс... произошла ошибка: \n ${e}`;
        }

    }

    @Hears(currentMonthKey)
    async getWorkTimeFromMonth(@Ctx() ctx: any) {
        const from: ContextFromType = ctx.update.message.from;
        const thisMonth = new Date().getMonth() + 1
        const thisYear = new Date().getFullYear()
        const arrayOfMilliseconds = await this.recordModel.findAll({
            attributes: ['workTime'],
            where: {userId: from.id, forwardMonth: thisMonth, forwardYear: thisYear}
        });
        await ctx.reply(`Время за текущий месяц: ${this.parseMillisecondsToTime(arrayOfMilliseconds)}`, this.keyboard)
        return
    }

    @Hears(previousMonthKey)
    async getWorkTimeFromPreviousMonth(@Ctx() ctx: any) {
        const from: ContextFromType = ctx.update.message.from;
        const previousMonth = new Date().getMonth()
        const thisYear = new Date().getFullYear()
        const arrayOfMilliseconds = await this.recordModel.findAll({
            attributes: ['workTime'],
            where: {userId: from.id, forwardMonth: previousMonth, forwardYear: thisYear},
        });
        await ctx.reply(`Время за прошлый месяц: ${this.parseMillisecondsToTime(arrayOfMilliseconds)}`, this.keyboard)
        return
    }


    @On("message")
    async on(@Ctx() ctx: any) {
        try {
            const from: ContextFromType = ctx.update.message.from;
            const forwardFrom: ContextForwardFromType = ctx.update.message.forward_from;
            if (!forwardFrom || forwardFrom.id !== this.parentBotId) return `${from.first_name}, ${this.getRandomJokePhrase()}`;
            const forwardDate = new Date(ctx.update.message.forward_date * 1000)
            const forwardDay = forwardDate.getDay()
            const forwardMonth = forwardDate.getMonth() + 1
            const forwardYear = forwardDate.getFullYear()
            const fullMessage = ctx.update.message.text;
            const workTime = this.parseMessageToWorkTime(fullMessage);
            const user = await this.userModel.findOne({where: {id: from.id}});
            const recordFromForwardDate = await this.recordModel.findOne({
                where: {
                    userId: user.id,
                    forwardDate
                }
            });
            if (recordFromForwardDate) return "Я это уже получал, спасибо.";
            const newRecord = {
                userId: user.id,
                fullMessage,
                workTime,
                forwardDate,
                forwardDay,
                forwardMonth,
                forwardYear,
            };
            await this.recordModel.create(newRecord);
            // return [this.getRandomGoodPhrase, this.keyboard]
            await ctx.reply(this.getRandomGoodPhrase, this.keyboard)
            return
        } catch (e) {
            console.log(e);
            return `Упс... произошла ошибка: \n ${e}`;
        }
    }
}
