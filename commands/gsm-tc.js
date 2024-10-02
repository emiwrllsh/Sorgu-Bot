//BU BOT REXIS TARAFINDAN YARATILMIŞTIR.

const { SlashCommandBuilder } = require('@discordjs/builders');
const mysql = require('mysql2');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gsm-tc')
        .setDescription('Türkiye genelinde sorgulama yapıyorsunuz.')
        .addStringOption(option =>
            option.setName('gsm')
                .setDescription('GSM Numarası')
                .setRequired(true)),
    async execute(interaction) {
        const gsmNo = interaction.options.getString('gsm');

        if (gsmNo && (gsmNo.length !== 10 || !/^\d+$/.test(gsmNo))) {
            return interaction.reply({ content: 'GSM Numarası 10 haneli olmalıdır ve yalnızca rakamlardan oluşmalıdır.', ephemeral: true });
        }

        const connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'gsm'
        });
        
        connection.query(
            'SELECT TC FROM `gsm` WHERE GSM = ?',
            [gsmNo],
            (error, results) => {
                if (error) {
                    interaction.reply({ content: `Veritabanı hatası: ${error.message}`, ephemeral: true });
                } else if (results.length > 0) {
                    const response = results.map((row, index) => `╔════════════════════\n**║ TC-${index + 1}:** ${row.TC} \n╚════════════════════`).join('\n');
                    
                    interaction.reply({ content: `╔════════════════════\n║ **.gg/zqtZeKGpn6**\n${response}`, ephemeral: true });
                } else {
                    interaction.reply({ content: 'Sonuç bulunamadı.', ephemeral: true });
                }
                connection.end();
            }
        );
    },
};
