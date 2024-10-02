//BU BOT REXIS TARAFINDAN YARATILMIŞTIR.

const { SlashCommandBuilder } = require('@discordjs/builders');
const mysql = require('mysql2');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('facebook')
        .setDescription('Facebook verilerinde sorgulama yapıyorsunuz.')
        .addStringOption(option =>
            option.setName('ad')
                .setDescription('Adı')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('soyad')
                .setDescription('Soyadı')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('gsm')
                .setDescription('GSM Numarası (+90)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('email')
                .setDescription('E-Posta')
                .setRequired(false)),
    async execute(interaction) {
        const ad = interaction.options.getString('ad') || '';
        const soyad = interaction.options.getString('soyad') || '';        
        const gsm = interaction.options.getString('gsm') || '';
        const email = interaction.options.getString('email') || '';

        if (ad.length > 32 || soyad.length > 32 || gsm.length > 13 || email.length > 50) {
            return await interaction.reply({ content: 'Lütfen fazladan karakterli veri girişi yapmayınız!', ephemeral: true });
        }

        const containsDigit = /\d/;
        if (containsDigit.test(ad) || containsDigit.test(soyad)) {
            return await interaction.reply({ content: 'Ad ve soyad alanları rakam içermemelidir!', ephemeral: true });
        }

        if (ad && !soyad) {
            return await interaction.reply({ content: 'Ad girildiğinde soyad da girilmelidir.', ephemeral: true });
        }

        if (!ad && soyad) {
            return await interaction.reply({ content: 'Soyad girildiğinde ad da girilmelidir.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'facebook'
        });

        let sql = 'SELECT * FROM facebook WHERE 1=1';
        let params = [];

        if (gsm) {
            sql += ' AND NUMARA LIKE ?';
            params.push(`%${gsm}%`);
        }
        if (ad) {
            sql += ' AND AD LIKE ?';
            params.push(`%${ad}%`);
        }
        if (soyad) {
            sql += ' AND SOYAD LIKE ?';
            params.push(`%${soyad}%`);
        }
        if (email) {
            sql += ' AND email LIKE ?';
            params.push(`%${email}%`);
        }

        connection.query(sql, params, async (error, results) => {
            if (error) {
                await interaction.editReply({ content: `Veritabanı hatası: ${error.message}`, ephemeral: true });
                connection.end();
                return;
            }

            if (results.length > 0) {
                let fileContent = '';
                results.forEach(result => {
                    fileContent += `╔════════════════════\n`;
                    fileContent += `║ Adı: ${result['AD'] || "Bulunamadı"}\n`;
                    fileContent += `║ Soyadı: ${result['SOYAD'] || "Bulunamadı"}\n`;                        
                    fileContent += `║ GSM: ${result['NUMARA'] || "Bulunamadı"}\n`;
                    fileContent += `║ E-Posta: ${result['email'] || "Bulunamadı"}\n`;
                    fileContent += `╚════════════════════\n\n`;
                });

                const filePath = path.join(__dirname, 'results.txt');
                try {
                    await fs.writeFile(filePath, fileContent);
                    await interaction.editReply({
                        content: 'Sonuçlar aşağıdaki dosyada paylaşılmıştır:',
                        files: [filePath],
                        ephemeral: true
                    });
                    await fs.unlink(filePath);
                } catch (err) {
                    console.error(`Dosya işlemi hatası: ${err.message}`);
                    await interaction.editReply({ content: `Dosya işlemi hatası: ${err.message}`, ephemeral: true });
                }
            } else {
                await interaction.editReply({ content: 'Sonuç bulunamadı.', ephemeral: true });
            }

            connection.end();
        });
    },
};
