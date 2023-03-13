import {Module} from "@nestjs/common";
import {AppService} from "./app.service";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {SequelizeModule} from "@nestjs/sequelize";
import {TelegrafModule} from "nestjs-telegraf";
import {User} from "./entities/User";
import {Record} from "./entities/Record";
import {PuppeteerModule} from "nest-puppeteer";
import {PuppeteerService} from "./puppeteer.service";

@Module({
    imports: [ConfigModule.forRoot({isGlobal: true}),
        SequelizeModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                dialect: "postgres",
                uri: configService.get("DB_URL"),
                ssl: true,
                synchronize: true,
                autoLoadModels: true,
                dialectOptions: {
                    encrypt: true,
                    ssl: {
                        rejectUnauthorized: false
                    }
                },
                models: [User, Record]
            }),
            inject: [ConfigService]
        }),
        SequelizeModule.forFeature([User, Record]),
        TelegrafModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                token: configService.get("BOT_TOKEN")
            }),
            inject: [ConfigService]
        }),
        PuppeteerModule.forRoot(
            {}
            // {pipe: true}, // optional, any Puppeteer launch options here or leave empty for good defaults */,
            // 'Chrome', // optional, can be useful for using Chrome and Firefox in the same project

        ),
        PuppeteerModule.forFeature([], 'test')
    ],
    controllers: [],
    providers: [AppService, PuppeteerService]
})

export class AppModule {
}
