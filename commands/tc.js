//BU BOT REXIS TARAFINDAN YARATILMIŞTIR.

const { SlashCommandBuilder } = require('@discordjs/builders');
const mysql = require('mysql2');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tc')
        .setDescription('Türkiye genelinde sorgulama yapıyorsunuz.')
        .addStringOption(option =>
            option.setName('tc')
                .setDescription('TC Kimlik Numarası')
                .setRequired(true)),
    async execute(interaction) {
        const tcNo = interaction.options.getString('tc');

        if (tcNo && (tcNo.length !== 11 || !/^\d+$/.test(tcNo))) {
            return interaction.reply({ content: 'TC Kimlik Numarası 11 haneli olmalıdır ve yalnızca rakamlardan oluşmalıdır.', ephemeral: true });
        }

        const connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: '101m'
        });

        connection.query(
            'SELECT * FROM `101m` WHERE TC = ?',
            [tcNo],
            (error, results) => {
                if (error) {
                    interaction.reply({ content: `Veritabanı hatası: ${error.message}`, ephemeral: true });
                } else if (results.length > 0) {
                    const result = results[0];
                    const response = `╔════════════════════\n**║ TC Kimlik No:** ${result.TC} \n**║ Adı:** ${result.AD} \n**║ Soyadı:** ${result.SOYAD} \n**║ Doğum Tarihi:** ${result.DOGUMTARIHI} \n**║ Adres İl:** ${result.NUFUSIL} \n**║ Adres İlçe:** ${result.NUFUSILCE} \n**║ Anne Adı:** ${result.ANNEADI} \n**║ Anne TC:** ${result.ANNETC} \n**║ Baba Adı:** ${result.BABAADI} \n**║ Baba TC:** ${result.BABATC} \n**║ Uyruk:** ${result.UYRUK} \n╚════════════════════`;
                    
                    interaction.reply({ content: `╔════════════════════\n║ **.gg/zqtZeKGpn6**\n${response}`, ephemeral: true });
                } else {
                    interaction.reply({ content: 'Sonuç bulunamadı.', ephemeral: true });
                }
                connection.end();
            }
        );
    },
};
