//BU BOT REXIS TARAFINDAN YARATILMIŞTIR.

const { SlashCommandBuilder } = require('@discordjs/builders');
const mysql = require('mysql2');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('operatör')
        .setDescription('Telefon numarası operatörünü sorgular.')
        .addStringOption(option =>
            option.setName('gsm')
                .setDescription('GSM Numarası')
                .setRequired(true)),
    async execute(interaction) {
        const gsmNo = interaction.options.getString('gsm');

        if (gsmNo && (gsmNo.length !== 10 || !/^\d+$/.test(gsmNo))) {
            return interaction.reply({ content: 'GSM Numarası 10 haneli olmalıdır ve yalnızca rakamlardan oluşmalıdır.', ephemeral: true });
        }

        const telekom = [501, 505, 506, 507, 551, 552, 553, 554, 555, 559];
        const turkcell = [530, 531, 532, 533, 534, 535, 536, 537, 538, 539];
        const vodafone = [540, 541, 542, 543, 544, 545, 546, 547, 548, 549];

        const opsorgu = gsmNo.substring(0, 3);
        let operator;

        if (telekom.includes(parseInt(opsorgu))) {
            operator = "TÜRK TELEKOM";
        } else if (turkcell.includes(parseInt(opsorgu))) {
            operator = "TURKCELL";
        } else if (vodafone.includes(parseInt(opsorgu))) {
            operator = "VODAFONE";
        } else {
            operator = "BİLİNMEYEN OPERATÖR";
        }

        const response = `╔════════════════════\n**║ GSM Numarası:** ${gsmNo} \n**║ GSM Operatörü:** ${operator} \n╚════════════════════`;
        
        interaction.reply({ content: `╔════════════════════\n║ **.gg/zqtZeKGpn6**\n${response}`, ephemeral: true });
    },
};
