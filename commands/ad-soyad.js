//BU BOT REXIS TARAFINDAN YARATILMIŞTIR.

const { SlashCommandBuilder } = require('@discordjs/builders');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ad-soyad')
        .setDescription('Türkiye genelinde sorgulama yapıyorsunuz.')
        .addStringOption(option =>
            option.setName('ad')
                .setDescription('Adı')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('soyad')
                .setDescription('Soyadı')
                .setRequired(true)),
    async execute(interaction) {
        const ad = interaction.options.getString('ad');
        const soyad = interaction.options.getString('soyad');

        if (ad.length > 32 || soyad.length > 32) {
            return await interaction.reply({ content: 'Lütfen fazladan karakterli veri girişi yapmayınız!', ephemeral: true });
        }

        const containsDigit = /\d/;
        if (containsDigit.test(ad) || containsDigit.test(soyad)) {
            return await interaction.reply({ content: 'Ad ve soyad alanları rakam içermemelidir!', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: '101m'
        });

        const sql = `
            SELECT * FROM 101m
            WHERE AD = ? AND SOYAD = ?
        `;

        connection.query(sql, [ad, soyad], async (error, results) => {
            if (error) {
                await interaction.editReply({ content: `Veritabanı hatası: ${error.message}`, ephemeral: true });
                connection.end();
                return;
            }

            if (results.length > 0) {
                let fileContent = '';
                results.forEach(result => {
                    fileContent += `╔════════════════════\n`;
                    fileContent += `║ TC Kimlik No: ${result["TC"] ?? "Bulunamadı"}\n`;
                    fileContent += `║ Adı: ${result["AD"] ?? "Bulunamadı"}\n`;
                    fileContent += `║ Soyadı: ${result["SOYAD"] ?? "Bulunamadı"}\n`;
                    fileContent += `║ Baba Adı: ${result["BABAADI"] ?? "Bulunamadı"}\n`;
                    fileContent += `║ Baba TC: ${result["BABATC"] ?? "Bulunamadı"}\n`;
                    fileContent += `║ Anne Adı: ${result["ANNEADI"] ?? "Bulunamadı"}\n`;
                    fileContent += `║ Anne TC: ${result["ANNETC"] ?? "Bulunamadı"}\n`;
                    fileContent += `║ Doğum Tarihi: ${result["DOGUMTARIHI"] ?? "Bulunamadı"}\n`;
                    fileContent += `║ Adres İl: ${result["NUFUSIL"] ?? "Bulunamadı"}\n`;
                    fileContent += `║ Adres İlçe: ${result["NUFUSILCE"] ?? "Bulunamadı"}\n`;
                    fileContent += `║ Uyruk: ${result["UYRUK"] ?? "Bulunamadı"}\n`;
                    fileContent += `╚════════════════════\n\n`;
                });

                const filePath = path.join(__dirname, 'results.txt');
                fs.writeFile(filePath, fileContent, async err => {
                    if (err) {
                        await interaction.editReply({ content: `Dosya oluşturma hatası: ${err.message}`, ephemeral: true });
                        return;
                    }

                    await interaction.editReply({
                        files: [filePath],
                        ephemeral: true
                    }).then(() => {
                        fs.unlink(filePath, err => {
                            if (err) {
                                console.error(`Dosya silme hatası: ${err.message}`);
                            }
                        });
                    }).catch(err => {
                        console.error(`Dosya gönderme hatası: ${err.message}`);
                        interaction.editReply({ content: `Dosya gönderme hatası: ${err.message}`, ephemeral: true });
                    });
                });
            } else {
                await interaction.editReply({ content: 'Sonuç bulunamadı.', ephemeral: true });
            }

            connection.end();
        });
    },
};
