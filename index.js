//BU BOT REXIS TARAFINDAN YARATILMIŞTIR.

const { Client, GatewayIntentBits, REST, Routes, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
    console.error('Gerekli çevre değişkenleri eksik: DISCORD_TOKEN, CLIENT_ID ve GUILD_ID tanımlanmış olmalıdır.');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers
    ]
});

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

const commands = [];
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (command.data && typeof command.execute === 'function') {
        commands.push(command.data.toJSON());
    } else {
        console.warn(`Komut ${file} geçerli bir 'execute' fonksiyonu içermiyor.`);
    }
}

client.once('ready', () => {
    console.log(`Bot ${client.user.tag} olarak giriş yaptı!`);

    client.user.setPresence({
        activities: [{ name: '.gg/zqtZeKGpn6', type: ActivityType.Watching }],
        status: 'online'
    });
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = commands.find(cmd => cmd.name === interaction.commandName);
    if (!command) {
        console.warn(`Komut ${interaction.commandName} tanımlı değil.`);
        return;
    }

    try {
        const commandFile = require(`./commands/${interaction.commandName}.js`);
        if (typeof commandFile.execute === 'function') {
            await commandFile.execute(interaction);
        } else {
            console.error(`Komut dosyası ${interaction.commandName} geçerli bir 'execute' fonksiyonu içermiyor.`);
        }
    } catch (error) {
        console.error('Komut işlenirken bir hata oluştu:', error);
        await interaction.reply({ content: 'Bir hata oluştu!', ephemeral: true });
    }
});

(async () => {
    try {
        const guildCommandsResponse = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
        console.log('Sunucuya özel komutlar temizlendi:', guildCommandsResponse);

        const globalCommandsResponse = await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
        console.log('Genel komutlar temizlendi:', globalCommandsResponse);

        const globalCommandsUploadResponse = await rest.put(Routes.applicationCommands(CLIENT_ID), {
            body: commands,
        });
        console.log('Genel komutlar yüklendi:', globalCommandsUploadResponse);

        const guildCommandsUploadResponse = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: commands,
        });
        console.log('Sunucuya özel komutlar yüklendi:', guildCommandsUploadResponse);

        console.log('Komutlar başarıyla yüklendi!');
    } catch (error) {
        console.error('Komutlar yüklenirken bir hata oluştu:', error);
    }
})();


client.login(DISCORD_TOKEN);
