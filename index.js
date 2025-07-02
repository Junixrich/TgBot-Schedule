/*
const TelegramApi = require('node-telegram-bot-api')

const token ='7716276952:AAHmKg8OleXxqAZKvdgYIghP6hTZQEP4ojk'

const bot =  new TelegramApi(token, {polling: true})



const start = () => {

bot.setMyCommands([
    {command: '/start', description: 'Начальное приветствие'},
    {command: '/info', description: 'Получить информацию о пользователе'}
])

bot.on('message', async msg => {
    const text = msg.text;
    const chatId = msg.chat.id;

    if(text === '/start'){
         await bot.sendSticker(chatId, 'https://cdn2.combot.org/sdarogishlyondry_by_fstikbot/webp/2xe29c82efb88f.webp') 
         return bot.sendMessage(chatId, `Добро пожаловать в телеграм бота расписания ЛГУ`)
    }
    if (text === '/info'){
         return bot.sendMessage(chatId, `Тебя зовут ${msg.from.first_name} ${msg.from.last_name}`)
    }
    
    return bot.sendMessage (chatId, 'Я тебя не понимаю, попробуй еще раз!')
    })
}

start()
*/


const TelegramApi = require('node-telegram-bot-api');
const token = '7716276952:AAHmKg8OleXxqAZKvdgYIghP6hTZQEP4ojk'; // ← Не забудь заменить!
const bot = new TelegramApi(token, { polling: true });

// Для работы с файлами
const fs = require('fs');
const path = require('path');

// Путь к JSON-файлу
const schedulePath = path.resolve(__dirname, 'schedule.json');

let scheduleData;

try {
    const rawData = fs.readFileSync(schedulePath);
    scheduleData = JSON.parse(rawData);
    console.log(' Расписание успешно загружено из файла');
} catch (err) {
    console.error(' Ошибка чтения или парсинга schedule.json:', err.message);
    process.exit(1); // Завершаем работу при ошибке
}

// Маппинг дней недели
const dayMapping = {
    1: 'понедельник',
    2: 'вторник',
    3: 'среда',
    4: 'четверг',
    5: 'пятница',
    6: 'суббота'
};

// Храним состояние пользователя
let userState = {}; // { chatId: { step: 'choose_week/day', week: 'weekhight/weeklow' } }

bot.setMyCommands([
    { command: '/start', description: 'Начать работу с ботом' }
]);

console.log(' Бот запущен и ожидает команды /start');

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    console.log(` Получен /start от chatId=${chatId}`);

    // Сбрасываем состояние
    userState[chatId] = { step: 'choose_week' };

    try {
        await bot.sendSticker(chatId, 'https://cdn2.combot.org/sdarogishlyondry_by_fstikbot/webp/2xe29c82efb88f.webp ');
        await bot.sendMessage(chatId, 'Добро пожаловать в телеграм бота расписания ЛГУ');
        console.log(` Приветственное сообщение отправлено chatId=${chatId}`);
    } catch (err) {
        console.error(` Ошибка отправки приветствия chatId=${chatId}:`, err.message);
    }

    // Предлагаем выбрать неделю
    const weekOptions = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Верхняя неделя', callback_data: 'weekhight' }],
                [{ text: 'Нижняя неделя', callback_data: 'weeklow' }]
            ]
        }
    };

    try {
        await bot.sendMessage(chatId, ' Выберите неделю:', weekOptions);
        console.log(` Кнопки выбора недели отправлены chatId=${chatId}`);
    } catch (err) {
        console.error(` Ошибка отправки кнопок недели chatId=${chatId}:`, err.message);
    }
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    console.log(` Получен callback от chatId=${chatId}, данные: ${data}`);

    const currentUser = userState[chatId];

    if (!currentUser) {
        console.warn(` Нет состояния для chatId=${chatId}. Возможно, пользователь не нажал /start`);
        return;
    }

    if (currentUser.step === 'choose_week') {
        if (data === 'weekhight' || data === 'weeklow') {
            currentUser.week = data;
            currentUser.step = 'choose_day';

            const dayButtons = Object.values(dayMapping).map(day => {
                return [{ text: day.charAt(0).toUpperCase() + day.slice(1), callback_data: `day_${day}` }];
            });

            const dayOptions = {
                reply_markup: {
                    inline_keyboard: dayButtons
                }
            };

            try {
                await bot.sendMessage(chatId, ' Теперь выбери день недели:', dayOptions);
                console.log(` Кнопки выбора дня отправлены chatId=${chatId}`);
            } catch (err) {
                console.error(` Ошибка отправки кнопок дня chatId=${chatId}:`, err.message);
            }
        } else {
            console.warn(` Неизвестная неделя: ${data}`);
        }
    }

    else if (currentUser.step === 'choose_day') {
        if (data.startsWith('day_')) {
            const day = data.replace('day_', '');

            const selectedWeek = currentUser.week;

            // Преобразуем текстовый день в номер
            const dayNumber = Object.keys(dayMapping).find(key => dayMapping[key] === day);

            if (!dayNumber) {
                console.warn(` Не найден день недели: ${day}`);
                return bot.sendMessage(chatId, ` День "${day}" не найден в расписании.`);
            }

            // Ищем расписание на этот день
            const weekScheduleArr = scheduleData.shedule;
            const weekScheduleObj = weekScheduleArr.find(obj => obj[selectedWeek]);
            if(!weekScheduleObj){
                console.error("Нет данных");
                return bot.message(chatId, "Нет данных")
            }
            const weekSchedule = weekScheduleObj[selectedWeek]
            console.log(weekSchedule)
            if (!weekSchedule) {
                console.error(` Нет данных для недели: ${selectedWeek}`);
                return bot.sendMessage(chatId, ` Нет данных для выбранной недели.`);
            }

            const dayData = weekSchedule.find(item => item.day === parseInt(dayNumber));
            console.log (dayData);
            if (!dayData) {
                console.warn(` На ${day} занятий нет для chatId=${chatId}`);
                return bot.sendMessage(chatId, ` На ${day} занятий нет.`);
            }

            let response = ` *${day.charAt(0).toUpperCase() + day.slice(1)}*\n\n`;
            dayData.lesson.forEach(lesson => {
                response += `${lesson.pare}. ${lesson.title}\n   Преподаватель: ${lesson.teacher}\n\n`;
            });

            try {
                await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
                console.log(` Расписание отправлено chatId=${chatId}, день: ${day}`);
            } catch (err) {
                console.error(` Ошибка отправки расписания chatId=${chatId}, день: ${day}:`, err.message);
            }

            // Кнопка для повторного выбора
            const againOptions = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Выбрать другое расписание', callback_data: 'reset' }]
                    ]
                }
            };

            try {
                await bot.sendMessage(chatId, ' Жми, чтобы выбрать другой день или неделю', againOptions);
                console.log(` Кнопка "ещё раз" отправлена chatId=${chatId}`);
            } catch (err) {
                console.error(` Ошибка отправки кнопки "ещё раз", chatId=${chatId}:`, err.message);
            }

            
        }

        if (data === 'reset') {
            userState[chatId] = { step: 'choose_week' };
            const weekOptions = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Верхняя неделя', callback_data: 'weekhight' }],
                        [{ text: 'Нижняя неделя', callback_data: 'weeklow' }]
                    ]
                }
            };

            try {
                await bot.sendMessage(chatId, ' Выберите неделю:', weekOptions);
                console.log(` Пользователь chatId=${chatId} вернулся к выбору недели`);
            } catch (err) {
                console.error(` Ошибка при сбросе до выбора недели chatId=${chatId}:`, err.message);
            }
        }
    }
});