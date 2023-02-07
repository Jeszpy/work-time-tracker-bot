import { Injectable } from "@nestjs/common";
import { Command, Ctx, On, Start, Update } from "nestjs-telegraf";
import { User } from "./entities/User";
import { InjectModel } from "@nestjs/sequelize";
import { ConfigService } from "@nestjs/config";
import { Record } from "./entities/Record";
import { millisecondsToHours } from 'date-fns'

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

  private phrases = ["не пытайся меня обмануть =)", "очень смешно :D", "да-да-да...", "удачи ^_^", "дать инструкцию? :)", "это шутка?"];

  private getRandomPhrase = () => {
    return this.phrases[Math.floor(Math.random() * this.phrases.length)];
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
    for (const el of workTime){
      totalCount += parseInt(el.workTime, 10)
    }
    const hours = millisecondsToHours(totalCount)
    return `${hours}`
  }

  @Start()
  async newUserInit(@Ctx() ctx: any): Promise<string> {
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
      return `Привет, ${user.firstName}! Теперь ты можешь мне отправлять сообщения от "бота инкубатора" для учёта твоих рабочих часов. Удачи! :)`;
    } catch (e) {
      // console.log(e);
      return `Упс... произошла ошибка: \n ${e}`;
    }

  }

  @Command("/day")
  async getWorkTimeFromDay(@Ctx() ctx: any) {
    const from: ContextFromType = ctx.update.message.from;
    const today = new Date().toISOString()
    const arrayOfMilliseconds = await this.recordModel.findAll({attributes: ['workTime'], where: { userId: from.id, date: today} });
    return this.parseMillisecondsToTime(arrayOfMilliseconds)
  }

  @Command("/month")
  async getWorkTimeFromMonth(@Ctx() ctx: any) {
    const from: ContextFromType = ctx.update.message.from;
    const thisMonth = new Date().getMonth()
    const thisYear = new Date().getFullYear()
    const arrayOfMilliseconds = await this.recordModel.findAll({attributes: ['workTime'], where: { userId: from.id} });
    console.log(arrayOfMilliseconds);
    return this.parseMillisecondsToTime(arrayOfMilliseconds)
  }

  @On("message")
  async on(@Ctx() ctx: any) {
    try {
      const from: ContextFromType = ctx.update.message.from;
      const forwardFrom: ContextForwardFromType = ctx.update.message.forward_from;
      if (!forwardFrom || forwardFrom.id !== this.parentBotId) return `${from.first_name}, ${this.getRandomPhrase()}`;
      const forwardDate = new Date(ctx.update.message.forward_date * 1000).toISOString();
      const fullMessage = ctx.update.message.text;
      const workTime = this.parseMessageToWorkTime(fullMessage);
      const user = await this.userModel.findOne({ where: { id: from.id } });
      const recordFromForwardDate = await this.recordModel.findOne({
        where: {
          userId: user.id,
          date: forwardDate
        }
      });
      if (recordFromForwardDate) return "Я это уже получал, спасибо.";
      const newRecord = {
        userId: user.id,
        fullMessage,
        workTime,
        date: forwardDate
      };
      await this.recordModel.create(newRecord);
      return "ok";
    } catch (e) {
      console.log(e);
      return `Упс... произошла ошибка: \n ${e}`;
    }
  }
}
