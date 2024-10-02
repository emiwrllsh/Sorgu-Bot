//BU BOT REXIS TARAFINDAN YARATILMIŞTIR.

const { SlashCommandBuilder } = require('@discordjs/builders');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('2015')
        .setDescription('2015 verilerinde sorgulama yapıyorsunuz.')
        .addStringOption(option =>
            option.setName('tc')
                .setDescription('TC Kimlik Numarası')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('ad')
                .setDescription('Adı')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('soyad')
                .setDescription('Soyadı')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('il')
                .setDescription('Adres İl')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('ilce')
                .setDescription('Adres İlçe')
                .setRequired(false)),
    async execute(interaction) {
        const tcNo = interaction.options.getString('tc') || '';
        const ad = interaction.options.getString('ad') || '';
        const soyad = interaction.options.getString('soyad') || '';
        const il = interaction.options.getString('il') || '';
        const ilce = interaction.options.getString('ilce') || '';

        if (ad.length > 32 || soyad.length > 32 || il.length > 14 || ilce.length > 16) {
            return await interaction.reply({ content: `Lütfen fazladan karakterli veri girişi yapmayınız!`, ephemeral: true });
        }

        if (tcNo && (tcNo.length !== 11 || !/^\d+$/.test(tcNo))) {
            return interaction.reply({ content: 'TC Kimlik Numarası 11 haneli olmalıdır ve yalnızca rakamlardan oluşmalıdır.', ephemeral: true });
        }

        if (tcNo && (ad || soyad || il || ilce)) {
            return interaction.reply({ content: 'TC girildiğinde diğer parametreler boş olmalıdır.', ephemeral: true });
        }

        const containsDigit = /\d/;
        if (containsDigit.test(ad) || containsDigit.test(soyad) || containsDigit.test(il) || containsDigit.test(ilce)) {
            return await interaction.reply({ content: 'Ad, soyad, il, ilçe alanları rakam içermemelidir!', ephemeral: true });
        }

        if (ad && !soyad) {
            return interaction.reply({ content: 'Ad girildiğinde soyad da girilmelidir.', ephemeral: true });
        }

        if (!ad && soyad) {
            return interaction.reply({ content: 'Soyad girildiğinde ad da girilmelidir.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'secmen2015'
        });

        let sql = "SELECT * FROM 2015 WHERE 1=1";
        let params = [];

        if (tcNo) {
            sql += " AND TC LIKE ?";
            params.push(`${tcNo}`);
        }
        if (ad) {
            sql += " AND ADI LIKE ?";
            params.push(`${ad}`);
        }
        if (soyad) {
            sql += " AND SOYADI LIKE ?";
            params.push(`${soyad}`);
        }
        if (il) {
            sql += " AND NUFUSIL LIKE ?";
            params.push(`${il}`);
        }
        if (ilce) {
            sql += " AND NUFUSILCESI LIKE ?";
            params.push(`${ilce}`);
        }

        if (params.length === 0) {
            await interaction.reply({ content: 'En az bir sorgu parametresi sağlamalısınız.', ephemeral: true });
            connection.end();
            return;
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
                    fileContent += `║ TC Kimlik No: ${result['TC'] ?? "Bulunamadı"}\n`;
                    fileContent += `║ Adı: ${result['ADI'] ?? "Bulunamadı"}\n`;
                    fileContent += `║ Soyadı: ${result['SOYADI'] ?? "Bulunamadı"}\n`;
                    fileContent += `║ Doğum Tarihi: ${result['DOGUMTARIHI'] ?? "Bulunamadı"}\n`;
                    fileContent += `║ Doğum Yeri: ${result['DOGUMYERI'] ?? "Bulunamadı"}\n`;
                    fileContent += `║ Cinsiyeti: ${result['CINSIYETI'] ?? "Bulunamadı"}\n`;
                    fileContent += `║ Anne Adı: ${result['ANAADI'] ?? "Bulunamadı"}\n`;
                    fileContent += `║ Baba Adı: ${result['BABAADI'] ?? "Bulunamadı"}\n`;
                    fileContent += `║ Nüfus İli: ${result['NUFUSILI'] ?? "Bulunamadı"}\n`;
                    fileContent += `║ Nüfus İlçesi: ${result['NUFUSILCESI'] ?? "Bulunamadı"}\n\n`;
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
