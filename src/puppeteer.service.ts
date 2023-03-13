import {Injectable} from "@nestjs/common";
import {InjectBrowser, InjectContext} from "nest-puppeteer";
import type { Browser, BrowserContext  } from 'puppeteer';

const sleep = seconds => new Promise(res => setTimeout(res, seconds * 1000));

const loginUrl = 'https://crm.kimitsu.it-incubator.ru/login956'

const myLogin = 'ГлебЛукашонок'
const myPassword = '7c00418'


@Injectable()
export class PuppeteerService {
    constructor( @InjectContext() private readonly browserContext: BrowserContext) {}

    private async page() {
        const pages = await this.browserContext.pages()
        return pages[0]
    }

     async login() {
        try {
            const sleepTime = 1
            const start = Date.now()
            const page = await this.page()
            await page.goto(loginUrl, {waitUntil: 'networkidle2'});
            const loginField = await page.waitForSelector('input[name=login]', {timeout: 3000})
            await loginField.tap()
            await page.keyboard.type(myLogin)
            const passwordField = await page.waitForSelector('input[name=password]', {timeout: 3000})
            await passwordField.tap()
            await page.keyboard.type(myPassword)
            const submitButton = await page.waitForSelector('button[type=submit]', {timeout: 3000})
            await submitButton.click()
            const roleSelector = await page.waitForSelector('div[role=button]', {timeout: 3000})
            await roleSelector.tap()
            const roleField = await page.waitForSelector('li[data-value="2"]', {timeout: 3000})
            await roleField.tap()
            await sleep(sleepTime)
            return `Login successful finished for ${((Date.now() - start) / 1000) - sleepTime} seconds`
        } catch (e) {
            return `Login failed with error: \n ${e}`
        }

    }

    async getPages () {
        const page = await this.page()
        const content = await page.content()
        const split =  content.split('Глеб Лукашонок')[1]
        console.log(split)
        console.log(content.length)
        return 'lol'
    }
}