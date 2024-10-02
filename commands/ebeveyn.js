//BU BOT REXIS TARAFINDAN YARATILMIŞTIR.

const { SlashCommandBuilder } = require('@discordjs/builders');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ebeveyn')
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

        await interaction.deferReply({ ephemeral: true });

        connection.query(
            'SELECT * FROM `101m` WHERE `TC` LIKE ?',
            [tcNo],
            async (error, results) => {
                if (error) {
                    await interaction.editReply({ content: `Veritabanı hatası: ${error.message}`, ephemeral: true });
                    connection.end();
                    return;
                }

                const arrall = [];

                if (results.length > 0) {
                    for (const row of results) {
                        const personInfo = {
                            TC: row.TC,
                            AD: row.AD || "Bulunamadı",
                            SOYAD: row.SOYAD || "Bulunamadı",
                            DOGUMTARIHI: row.DOGUMTARIHI || "Bulunamadı",
                            NUFUSIL: row.NUFUSIL || "Bulunamadı",
                            NUFUSILCE: row.NUFUSILCE || "Bulunamadı",
                            ANNEADI: row.ANNEADI || "Bulunamadı",
                            ANNETC: row.ANNETC || "Bulunamadı",
                            BABAADI: row.BABAADI || "Bulunamadı",
                            BABATC: row.BABATC || "Bulunamadı",
                            YAKINLIK: 'Kendisi'
                        };
                        arrall.push(personInfo);

                        try {
                            const [parentResults] = await connection.promise().query(
                                'SELECT * FROM `101m` WHERE `TC` = ? OR `TC` = ?',
                                [row.BABATC, row.ANNETC]
                            );

                            parentResults.forEach(parent => {
                                const parentInfo = {
                                    TC: parent.TC,
                                    AD: parent.AD || "Bulunamadı",
                                    SOYAD: parent.SOYAD || "Bulunamadı",
                                    DOGUMTARIHI: parent.DOGUMTARIHI || "Bulunamadı",
                                    NUFUSIL: parent.NUFUSIL || "Bulunamadı",
                                    NUFUSILCE: parent.NUFUSILCE || "Bulunamadı",
                                    ANNEADI: parent.ANNEADI || "Bulunamadı",
                                    ANNETC: parent.ANNETC || "Bulunamadı",
                                    BABAADI: parent.BABAADI || "Bulunamadı",
                                    BABATC: parent.BABATC || "Bulunamadı",
                                    YAKINLIK: 'Ebeveyni'
                                };
                                arrall.push(parentInfo);
                            });

                        } catch (error) {
                            await interaction.editReply({ content: `Veritabanı hatası: ${error.message}`, ephemeral: true });
                            connection.end();
                            return;
                        }
                    }

                    if (arrall.length > 0) {
                        const filePath = path.join(__dirname, 'results.txt');
                        const fileContent = arrall.map(person => 
                            `╔════════════════════\n` +
                            `║ **TC Kimlik No:** ${person.TC}\n` +
                            `║ **Adı:** ${person.AD}\n` +
                            `║ **Soyadı:** ${person.SOYAD}\n` +
                            `║ **Doğum Tarihi:** ${person.DOGUMTARIHI}\n` +
                            `║ **Adres İl:** ${person.NUFUSIL}\n` +
                            `║ **Adres İlçe:** ${person.NUFUSILCE}\n` +
                            `║ **Anne Adı:** ${person.ANNEADI}\n` +
                            `║ **Anne TC:** ${person.ANNETC}\n` +
                            `║ **Baba Adı:** ${person.BABAADI}\n` +
                            `║ **Baba TC:** ${person.BABATC}\n` +
                            `║ **Yakınlık:** ${person.YAKINLIK}\n` +
                            `╚════════════════════\n`
                        ).join('\n');

                        fs.writeFile(filePath, fileContent, async (err) => {
                            if (err) {
                                console.error('Dosya yazma hatası:', err);
                                await interaction.editReply({ content: 'Dosya oluşturulurken bir hata oluştu.', ephemeral: true });
                                connection.end();
                                return;
                            }

                            await interaction.editReply({
                                files: [filePath],
                                ephemeral: true
                            });

                            fs.unlink(filePath, (err) => {
                                if (err) console.error('Dosya silme hatası:', err);
                            });
                            connection.end();
                        });
                    } else {
                        await interaction.editReply({ content: 'Hiçbir sonuç bulunamadı.', ephemeral: true });
                        connection.end();
                    }
                } else {
                    await interaction.editReply({ content: 'Hiçbir sonuç bulunamadı.', ephemeral: true });
                    connection.end();
                }
            }
        );
    }
};
