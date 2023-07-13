const express = require('express');
// 下载了libreria - telegraf ; 使用解构
const { Telegraf } = require('telegraf');

const axios = require('axios');
const { chatGPT, chatGPTv2 } = require('./utils');
const googleTTS = require('google-tts-api');

const User = require('./models/user.model')

// ------- 以上是下载的引用的libreria


// config .env
require('dotenv').config();

// CONFIG DB
require('./config/db')

const app = express();

// 调用隔壁存的token
const bot = new Telegraf(process.env.BOT_TOKEN);

// config Telegraf - cual es nuestro url con que tiene que trabajar
app.use(bot.webhookCallback('/telegram-bot'));   // url interno
bot.telegram.setWebhook(`${process.env.BOT_URL}/telegram-bot`)   // url publico para que gente use

app.post('/telegram-bot', (req, res) => {
    res.send('telegrambot viene');
})

// middleware
bot.use(async (ctx, next) => {

    console.log(ctx.from);  // 获取用户信息

    ctx.from.telegram_id = ctx.from.id;  // 将用户id赋值给我们在model里写的telegram_id

    const user = await User.findOne({ telegram_id: ctx.from.id }); // 如果新进来的用户不存在，则将他添加user（findone也是自带的方法）

    if (!user) await User.create(ctx.from)  // 获取信息后，在数据库中创建一个新的用户， 这里用的create是mongoose自带的方法  



    next()
    // ctx.reply('dentro del middleware')
})


// comandos
bot.command('test', async (ctx) => {
    console.log(ctx.message);

    await ctx.reply(`lalalala miercoles ya ${ctx.from.first_name}`);
    await ctx.replyWithDice();

})

bot.command('tiempo', async (ctx) => {
    console.log(ctx.message.text);
    let text = ctx.message.text

    // let ciudad = text.split(" ");
    // console.log(ciudad[1]);

    let ciudad = text.slice(8)
    // let ciudad = ctx.message.text.substring(8)

    // 这种是async，await的写法（async在上面，主函数那里）
    try {
        // 直接对象解构，获取data
        const { data } = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${process.env.OWM_API_KEY}&units=metric`);
        console.log(data.main);

        let temActual = data.main.temp;
        let temMax = data.main.temp_max;
        let temMin = data.main.temp_min;
        let humedad = data.main.humidity;

        await ctx.reply(`Temperatura actual: ${temActual}°,\n temperatura maxima: ${temMax}°, \n temperatura minima: ${temMin}° y la humedad es :${humedad}%`);

        await ctx.replyWithLocation(data.coord.lat, data.coord.lon)
    } catch (err) {
        console.log(err);
        ctx.reply('Ha ocurrido un error. Vuelve a intentarlo.')
    }


    // try and catch 的写法(temActual这种变量需要在外面申明)
    // axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${ciudad[1]}&appid=12cc61f3282afaca14152a6185f43de0&units=metric`).
    //     then(async res => {
    //         console.log(res.data.main);
    //         temActual = res.data.main.temp
    //         await ctx.reply('Temperadua actual:' + temActual)
    //     }).catch(err => {
    //         console.log(err);
    //     })

})

bot.command('receta', async (ctx) => {
    let text = ctx.message.text;
    let incredientes = text.slice(8);

    const response = await chatGPT(incredientes);

    ctx.reply(response);
})


bot.command('chat', async ctx => {
    const mensaje = ctx.message.text.slice(6);

    const count = await User.countDocuments();  // 统计数据库中的用户数量
    console.log(count);

    const randomNum = Math.floor(Math.random() * count); // 获取以用户数量为基准的随机数

    const user = await User.findOne().skip(randomNum); // 找到这个数的用户
    console.log(user);

    bot.telegram.sendMessage(user.telegram_id, mensaje)    //reply是回复给自己，message是发给其他的用户

    ctx.reply(`Mensaje enviado a ${user.first_name}`)
})
// eventos 
bot.on('text', async ctx => {
    // ctx.reply('Prueba')

    // const response = await chatGPTv2(ctx.message.text);

    const response = ctx.message.text;

    // 生成语音
    // const url = googleTTS.getAudioUrl(response, {
    //     lang: 'es', slow: false, host: 'https://translate.google.com'
    // })

    await ctx.reply(response);
    // 生成回复的语音
    // await ctx.replyWithAudio(url)  
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});