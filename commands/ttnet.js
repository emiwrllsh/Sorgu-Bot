//BU BOT REXIS TARAFINDAN YARATILMIŞTIR.

const { SlashCommandBuilder } = require('@discordjs/builders');
const mysql = require('mysql2');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ttnet')
        .setDescription('TTNET verilerinde sorgulama yapıyorsunuz.')
        .addStringOption(option =>
            option.setName('adsoyad')
                .setDescription('Adı Soyadı')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('telefon')
                .setDescription('Telefon Numarası')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('eposta')
                .setDescription('E-Posta')
                .setRequired(false)),
    async execute(interaction) {
        const adsoyad = interaction.options.getString('adsoyad') || '';
        const telefon = interaction.options.getString('telefon') || '';
        const eposta = interaction.options.getString('eposta') || '';

        if (adsoyad.length > 64 || telefon.length > 10 || eposta.length > 48) {
            return await interaction.reply({ content: 'Lütfen fazladan karakterli veri girişi yapmayınız!', ephemeral: true });
        }

        const containsDigit = /\d/;
        if (containsDigit.test(adsoyad)) {
            return await interaction.reply({ content: 'Adı soyadı alanı rakam içermemelidir!', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'ttnet'
        });

        let sql = 'SELECT * FROM ttnet WHERE 1=1';
        let params = [];

        if (adsoyad) {
            sql += ' AND ADSOYAD LIKE ?';
            params.push(`%${adsoyad}%`);
        }
        if (telefon) {
            sql += ' AND Telefon LIKE ?';
            params.push(`%${telefon}%`);
        }
        if (eposta) {
            sql += ' AND EPOSTA LIKE ?';
            params.push(`%${eposta}%`);
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
                    fileContent += `║ Adı Soyadı: ${result['ADSOYAD'] || "Bulunamadı"}\n`;
                    fileContent += `║ Telefon: ${result['Telefon'] || "Bulunamadı"}\n`;
                    fileContent += `║ GSM: ${result['GSM'] || "Bulunamadı"}\n`;
                    fileContent += `║ E-Posta: ${result['EPOSTA'] || "Bulunamadı"}\n`;
                    fileContent += `║ Adres: ${result['ADRES'] || "Bulunamadı"}\n`;
                    fileContent += `║ Şehir: ${result['SEHIR'] || "Bulunamadı"}\n`;
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
