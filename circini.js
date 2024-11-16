// CIRCINI Bot
// created by @neartsua on Discord.

require('dotenv').config();
const { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ApplicationCommandOptionType, REST, Routes, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EntryPointCommandHandlerType } = require('discord.js');
const fs = require('fs');
const path = require('path')
var sanitizer = require('sanitize')();
const mariadb = require('mariadb');

const client = new Client({
    intents: [
    ]
})

// values
const memberLimit = 100;
const pagination = 12;

// regular functions
function checkURL(url) {
    try {
        new URL(url);
        return true;
    } catch (err) {
        return false;
    }
}

// db functions

async function createSystem(discid, sysname, pool, interaction) {
    let conn;
    // see if user exists
    try {
        let sql = "SELECT sysname FROM users WHERE discid = ?"
        let san_discid = sanitizer.value(discid, 'str');
        conn = await pool.getConnection();
        const rows = await conn.query(sql, [san_discid]);
        if (rows.length > 0) { // if user is in database
            interaction.editReply(`You have already created a system!  Your current system name is ${rows[0]['sysname']}.\nIf you want to rename or delete the system, use the \`/system name\` or \`system delete\` commands.`);
            if (conn) conn.end();
            return;
        } else { // otherwise allow new entry

            // sanitize first
            let san_sysname = sanitizer.value(sysname, 'str');

            let sql = `INSERT INTO users (discid, sysname) VALUES (?, ?)`;
            try {
                await conn.query(sql, [san_discid, san_sysname]);
                interaction.editReply(`System ${san_sysname} created!`);
            } catch (err) {
                interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
                throw err;
            } finally {
                if (conn) conn.end();
            }
        }
    } catch (err) {
        interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
        throw err;
    } finally {
        if (conn) conn.end();
    }
}

async function createMember(discid, memname, proxy, color, avatar, pool, interaction) {

    let conn;

    let sql = "SELECT proxy, memname FROM members WHERE discid = ? AND memname = ?"

    // sanitize first
    let san_proxy = sanitizer.value(proxy, 'str');
    let san_discid = sanitizer.value(discid, 'str');
    let san_memname = sanitizer.value(memname, 'str');
    let san_color = sanitizer.value(color, 'str');
    let san_avatar = sanitizer.value(avatar, 'str');

    try {
        conn = await pool.getConnection();
        const rows = await conn.query(sql, [san_discid, san_memname]);
        if (rows.length > 0) { // if member is in database
            let errors = [];
            if (rows[0]['proxy'] === san_proxy) {
                errors.push(`A member already has proxy '${san_proxy}'. You cannot have the same proxy for multiple members.`);
            }
            if (rows[0]['memname'] === san_memname) {
                errors.push(`A member already has name '${san_memname}'. You cannot have the same name for multiple members.`);
            }
            interaction.editReply(errors.join('\n'))
            if (conn) conn.end();
            return;
        } else {
            try {
                conn = await pool.getConnection();
                let sql = `INSERT INTO members (discid, memname, proxy, color, avatar) VALUES (?, ?, ?, ?, ?)`;
                try {
                    await conn.query(sql, [san_discid, san_memname, san_proxy, san_color, san_avatar]);
                    interaction.editReply(`Member ${memname} created!`);
                } catch (err) {
                    throw err;
                } finally {
                    if (conn) conn.end();
                }
            } catch (err) {
                throw err;
            } finally {
                if (conn) conn.end();
            }
        }
    } catch (err) {
        interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
        throw err;
    } finally {
        if (conn) conn.end();
    }
}

async function listMember(san_memname, san_discid, conn, interaction) {
    try {
        let sql = "SELECT memname, proxy, avatar, color, memid FROM members WHERE discid = ? AND memname = ?";
        const row = await conn.query(sql, [san_discid, san_memname]);
        if (!row[0]) {
            interaction.editReply(`Error! (Do you have this member created?)`);
            conn.end();
            return;
        }
        const embed = new EmbedBuilder()
            .setColor(row[0]['color'])
            .setTitle(row[0]['memname'])
            .setDescription(`Proxy: ${row[0]['proxy']}\nAvatar: ${row[0]['avatar']}\nColor: ${row[0]['color']}`)

        interaction.editReply({ embeds: [embed] });
    } catch (err) {
        interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
        throw err;
    } finally {
        if (conn) conn.end();
    }
}

async function editColor(newColor, san_discid, san_memname, conn, interaction) {
    try {
        let sql = "UPDATE members SET color = ? WHERE discid = ? AND memname = ?";
        const rows = await conn.query(sql, [newColor, san_discid, san_memname]);
        if (rows['affectedRows'] === 1) {
            interaction.editReply(`${san_memname}'s color has been changed to ${newColor}!`)
        } else {
            interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
        }
    } catch (err) {
        interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
        throw err;
    } finally {
        if (conn) conn.end();
    }
}

async function editName(newName, san_discid, san_memname, conn, interaction) {
    try {
        let sql = "UPDATE members SET memname = ? WHERE discid = ? AND memname = ?";
        const rows = await conn.query(sql, [newName, san_discid, san_memname]);
        if (rows['affectedRows'] === 1) {
            interaction.editReply(`${san_memname}'s name has been changed to ${newName}!`)
        } else {
            interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
        }
    } catch (err) {
        interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
        throw err;
    } finally {
        if (conn) conn.end();
    }
}

async function editProxy(newProxy, san_discid, san_memname, conn, interaction) {
    try {
        let sql = "UPDATE members SET proxy = ? WHERE discid = ? AND memname = ?";
        const rows = await conn.query(sql, [newProxy, san_discid, san_memname]);
        if (rows['affectedRows'] === 1) {
            interaction.editReply(`${san_memname}'s proxy has been changed to ${newProxy}!`)
        } else {
            interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
        }
    } catch (err) {
        interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
        throw err;
    } finally {
        if (conn) conn.end();
    }
}

async function editAv(newAv, san_discid, san_memname, conn, interaction) {
    try {

        if (!newAv.startsWith('<')) { // if avatar is *NOT* custom emoji, check if it's a valid URL
            let isValidURL = checkURL(newAv);
            if (!isValidURL) {
                interaction.editReply(`Error! Avatar needs to be either an emoji ID or a valid URL.\n(See /help for more info.)`)
                conn.end();
                return;
            }
        }

        let sql = "UPDATE members SET avatar = ? WHERE discid = ? AND memname = ?";
        const rows = await conn.query(sql, [newAv, san_discid, san_memname]);
        if (rows['affectedRows'] === 1) {
            interaction.editReply(`${san_memname}'s avatar has been changed!`)
        } else {
            interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
        }
    } catch (err) {
        interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
        throw err;
    } finally {
        if (conn) conn.end();
    }
}

async function deleteMember(san_discid, san_memname, conn, interaction) {
    try {
        let sql = `DELETE FROM members WHERE discid = ? AND memname = ?`;
        try {
            await conn.query(sql, [san_discid, san_memname]);
            interaction.editReply(`Member ${san_memname} deleted!`);
        } catch (err) {
            interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
            throw err;
        } finally {
            if (conn) conn.end();
        }
    } catch (err) {
        interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
        throw err;
    } finally {
        if (conn) conn.end();
    }
}

async function renameSystem(san_discid, san_sysname, pool, interaction) {
    try {
        // then update
        let sql = "UPDATE users SET sysname = ? WHERE discid = ?";
        conn = await pool.getConnection();
        const rows = await conn.query(sql, [san_sysname, san_discid]);
        if (rows['affectedRows'] === 1) {
            interaction.editReply(`System name changed to ${san_sysname}!`)
        } else {
            interaction.editReply(`Error! Do you have a system registered? (If so, did you spell it right?)`);
        }
    } catch (err) {
        interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
        throw err;
    } finally {
        if (conn) conn.end();
    }
}

async function listSystem(san_discid, pool, interaction) {
    try {
        let sql = "SELECT memname, proxy, avatar, color FROM members WHERE discid = ?";
        conn = await pool.getConnection();
        const rows = await conn.query(sql, [san_discid]);
        if (!rows[0]) {
            interaction.editReply(`Error! (Do you have a system created?)`)
            conn.end();
            return;
        }
        let sql2 = "SELECT sysname FROM users WHERE discid = ?";
        const sysnameRow = await conn.query(sql2, [san_discid]);
        const sysname = sysnameRow[0]['sysname'];

        if (rows.length > pagination) { // if system has more than PAGINATION members, split into chunks, put into an embed, and stick embed in array
            let pages = [];
            for (i = 0; i < rows.length; i += pagination) {
                const chunk = rows.slice(i, i + pagination);
                let page = [];
                chunk.forEach(entry => {
                    page.push(`**${entry['memname']}**, proxy \`${entry['proxy']}\``);
                });
                const embed = new EmbedBuilder()
                    .setColor('#FFFFFF')
                    .setTitle(sysname)
                    .setDescription(page.join('\n'))
                    .setFooter({text: `Displaying ${i+1}-${Math.min(i + pagination, i + page.length)} of ${rows.length} results.`})
                pages.push(embed);
            }

            let startbuttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('back')
                        .setLabel('<')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('forward')
                        .setLabel('>')
                        .setStyle(ButtonStyle.Primary)
                )

            let middlebuttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('back')
                        .setLabel('<')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('forward')
                        .setLabel('>')
                        .setStyle(ButtonStyle.Primary)
                )

            let endbuttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('back')
                        .setLabel('<')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('forward')
                        .setLabel('>')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                )

            let response = await interaction.editReply({
                embeds: [pages[0]],
                components: [startbuttons]
            })

            let index = 0;

            const collector1 = response.createMessageComponentCollector({ time: 300000 })
            collector1.on('collect', async listen1 => {
                let buttons;
                if (listen1.customId === 'back') {
                    index -= 1;
                    if (index <= 0) {
                        index = 0;
                        buttons = startbuttons;
                    } else {
                        buttons = middlebuttons;
                    }
                    await listen1.deferUpdate();
                    await listen1.editReply({ embeds: [pages[index]], components: [buttons] })
                }
                if (listen1.customId === 'forward') {
                    index += 1;
                    if (index >= pages.length - 1) {
                        index = pages.length - 1;
                        buttons = endbuttons;
                    } else {
                        buttons = middlebuttons;
                    }
                    await listen1.deferUpdate();
                    await listen1.editReply({ embeds: [pages[index]], components: [buttons] })
                }
            })

        } else {
            let members = [];
            for (i = 0; i < rows.length; i++) {
                members.push(`**${rows[i]['memname']}**, proxy \`${rows[i]['proxy']}\``);
            }
            const embed = new EmbedBuilder()
                .setColor('#FFFFFF')
                .setTitle(sysname)
                .setDescription(members.join('\n'))
                .setFooter({text: `${rows.length} results.`})
            interaction.editReply({ embeds: [embed] })
        }

    } catch (err) {
        interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
        throw err;
    } finally {
        if (conn) conn.end();
    }
}

async function deleteSystem(san_discid, confirm, pool, interaction) {
    try {
        // then update
        let sql = "SELECT sysname FROM users WHERE discid = ?";
        conn = await pool.getConnection();
        const rows = await conn.query(sql, [san_discid]);

        if (!rows[0]) {
            interaction.editReply(`Error! Either your system name is different (or has typos), or you do not have a registered system.`);
            conn.end();
            return;
        }

        if (rows[0]['sysname'] === confirm) {
            try {
                let sql = "DELETE FROM users WHERE discid = ?";
                await conn.query(sql, [san_discid]);
                let sql2 = "DELETE FROM members WHERE discid = ?";
                await conn.query(sql2, [san_discid]);
                interaction.editReply(`System ${rows[0]['sysname']} and all members deleted.`)
            } catch (err) {
                interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
                throw err;
            } finally {
                if (conn) conn.end();
            }
        } else {
            interaction.editReply(`Error! Either system name is different, or you do not have a registered system.`)
        }
    } catch (err) {
        interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
        throw err;
    } finally {
        if (conn) conn.end();
    }
}

async function handleProxying(proxy, message, san_discid, pool, interaction) {
    let san_proxy = sanitizer.value(proxy, 'str');
    let san_message = sanitizer.value(message, 'str');

    try {
        conn = await pool.getConnection();
        let sql = "SELECT memname, avatar, color FROM members WHERE discid = ? AND proxy = ?";
        try {
            const rows = await conn.query(sql, [san_discid, san_proxy]);
            const row = rows[0];
            if (row) {
                if (row['avatar'].startsWith('<:')) {
                    let testmessage = `${row['avatar']} **${row['memname']}**\n         ` + san_message;
                    await interaction.editReply(testmessage)
                } else {
                    const embed = new EmbedBuilder()
                        .setColor(row['color'])
                        .setAuthor({ name: row['memname'], iconURL: row['avatar'] })
                        .setDescription(san_message)

                    interaction.editReply({ embeds: [embed] });
                }
            } else {
                interaction.editReply(`No proxy found for ${san_proxy}.`);
                conn.end();
            }
        } catch (err) {
            interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
            throw err;
        } finally {
            if (conn) conn.end();
        }
    } catch (err) {
        interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
        throw err;
    } finally {
        if (conn) conn.end();
    }
}

client.on('ready', (c) => {
    console.log(`${c.user.tag} is ready!`)
});

client.on('interactionCreate', async (interaction) => {

    if (!interaction.isChatInputCommand()) return;

    // open pool
    const pool = mariadb.createPool({
        host: 'localhost',
        database: 'circini',
        user: process.env.MDB_USER,
        password: process.env.MDB_PASS,
    });

    if (interaction.commandName === 'help') {
        let help = new EmbedBuilder()
            .setTitle('Circini')
            .setDescription(`***About***
                Circini is a bot that allows "proxied" messages to be sent in DMs through embeds, custom emojis, and slash commands.\n
                ***Member Limit***
                This bot is running on very old hardware, so there is a ${memberLimit}-member limit currently. (If you want that limit raised, ask @neartsua about it!)\n
                ***Commands List:***
                For a full commands list, please see [here](https://github.com/northperseids/circini-plures).\n
                ***Basics***
                /help - help and setup information
                /system create - register a new system tied to your Discord account
                /member add - add a member to your system
                /system view - see all members registered in your system
                /member view - see details for a specific member in your system
                /proxy - send a message as a system member using their proxy\n
                Click the "Quickstart" button to get started.\n
                *For the support server, click [here](https://discord.gg/u3zB6z4bkC).*`)
            .setColor('#FFFFFF')

        let setup = new EmbedBuilder()
            .setColor('#FFFFFF')
            .setTitle('Quickstart')
            .setDescription(`**Create system:**
            First things first, run \`/system create\` to create your system.\n
            **Add members:**
            Run \`/member add\` to add your first member. Follow the on-screen prompts.\n
            **Use proxies:**
            You should now be able to run your proxy command by typing \`/proxy\`, entering the proxy, and entering a message!

            ***Formats and emojis***
            Circini can use emojis as member icons for a more condensed format. Click "Emojis" for more details.`)

        let advsetup = new EmbedBuilder()
            .setColor('#FFFFFF')
            .setTitle('Emoji Setup')
            .setDescription(`**Condensed or Embed Formats**
            Circini can use emojis as member icons. Circini automatically defaults to Embed formats when a *URL* is given in the Avatar field, or Condensed when an *EMOJI ID* is given.\n
            **NOTE THAT IN ORDER TO USE A CUSTOM EMOJI, CIRCINI MUST BE IN THE SERVER THE EMOJI IS FROM, EVEN IF YOU'RE ONLY USING CIRCINI IN DMs.**\n
            To use the Condensed format, upload your emoji to your server, then *while in the server* type in a backslash \`\\\` and then the emoji name. When you press enter, Discord will give you the emoji ID.
            Run \`/member avatar\` and paste the emoji ID into the avatar field.\n
            Circini should now use the condensed format with the emoji as the system member icon!`)

        let buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('help')
                    .setLabel('Help')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('setup')
                    .setLabel('Quickstart')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('advanced')
                    .setLabel('Emojis')
                    .setStyle(ButtonStyle.Primary)
            )

        let response = await interaction.reply({
            embeds: [help],
            components: [buttons],
            ephemeral: true
        })

        const collector1 = response.createMessageComponentCollector({ time: 300000 })
        collector1.on('collect', async listen1 => {
            if (listen1.customId === 'help') {
                await listen1.deferUpdate();
                await listen1.editReply({ embeds: [help], components: [buttons], ephemeral: true })
            }
            if (listen1.customId === 'setup') {
                await listen1.deferUpdate();
                await listen1.editReply({ embeds: [setup], components: [buttons], ephemeral: true })
            }
            if (listen1.customId === 'advanced') {
                await listen1.deferUpdate();
                await listen1.editReply({ embeds: [advsetup], components: [buttons], ephemeral: true })
            }
        })
    }

    if (interaction.commandName === 'view') {

        await interaction.deferReply();

        if (interaction.options.getSubcommand() === 'system') {
            let san_discid = sanitizer.value(interaction.user.id, 'str');
            listSystem(san_discid, pool, interaction).then(() => { pool.end() });
        }
        if (interaction.options.getSubcommand() === 'member') {

            let san_memname = sanitizer.value(interaction.options.get('name').value, 'str');
            let san_discid = sanitizer.value(interaction.user.id, 'str');

            let conn;

            // see if member exists and open connection
            try {
                let sql = "SELECT memname FROM members WHERE discid = ? AND memname = ?"
                conn = await pool.getConnection();
                const rows = await conn.query(sql, [san_discid, san_memname]);
                if (rows.length > 0) {
                    listMember(san_memname, san_discid, conn, interaction).then(() => { pool.end() });
                } else {
                    interaction.editReply(`Cannot find member ${san_memname}.`);
                    conn.end();
                    return;
                }
            } catch (err) {
                interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
                throw err;
            }
        }

    }

    if (interaction.commandName === 'system') {
        await interaction.deferReply();

        let san_discid = sanitizer.value(interaction.user.id, 'str');

        if (interaction.options.getSubcommand() === 'create') {
            let san_sysname = sanitizer.value(interaction.options.get('sysname').value, 'str');
            createSystem(san_discid, san_sysname, pool, interaction).then(() => { pool.end() });
        }
        if (interaction.options.getSubcommand() === 'name') {
            let san_sysname = sanitizer.value(interaction.options.get('name').value, 'str');
            renameSystem(san_discid, san_sysname, pool, interaction).then(() => { pool.end() });
        }
        if (interaction.options.getSubcommand() === 'delete') {
            let confirmed = sanitizer.value(interaction.options.get('confirmdelete').value, 'str');
            deleteSystem(san_discid, confirmed, pool, interaction).then(() => { pool.end() });
        }
    }

    if (interaction.commandName === 'member') {

        await interaction.deferReply();

        let san_memname = sanitizer.value(interaction.options.get('name').value, 'str');
        let san_discid = sanitizer.value(interaction.user.id, 'str');

        let exists = false;

        let conn;

        // see if member exists and open connection
        try {
            let sql = "SELECT memname FROM members WHERE discid = ? AND memname = ?"
            conn = await pool.getConnection();
            const rows = await conn.query(sql, [san_discid, san_memname]);
            if (rows.length > 0) {
                exists = true;
            } else {
                interaction.editReply(`Cannot find member ${san_memname}.`);
                conn.end();
                return;
            }
        } catch (err) {
            interaction.editReply({ content: `Error! (If this happens repeatedly, please contact @neartsua.)`, ephemeral: true });
            throw err;
        }

        if (exists === true) {
            if (interaction.options.getSubcommand() === 'color') {

                let newColor = sanitizer.value(interaction.options.get('color').value, 'str');
                editColor(newColor, san_discid, san_memname, conn, interaction).then(() => { pool.end() });

            } else if (interaction.options.getSubcommand() === 'name') {

                let newName = sanitizer.value(interaction.options.get('newname').value, 'str');
                editName(newName, san_discid, san_memname, conn, interaction).then(() => { pool.end() });

            } else if (interaction.options.getSubcommand() === 'proxy') {

                let newProxy = sanitizer.value(interaction.options.get('proxy').value, 'str').toLowerCase();
                editProxy(newProxy, san_discid, san_memname, conn, interaction).then(() => { pool.end() });

            } else if (interaction.options.getSubcommand() === 'avatar') {

                let newAv = sanitizer.value(interaction.options.get('avatar').value, 'str');
                editAv(newAv, san_discid, san_memname, conn, interaction).then(() => { pool.end() });

            } else if (interaction.options.getSubcommand() === 'delete') {

                deleteMember(san_discid, san_memname, conn, interaction).then(() => { pool.end() });

            } else if (interaction.options.getSubcommand() === 'add') {
                await interaction.deferReply()

                let san_memname = sanitizer.value(interaction.options.get('name').value, 'str');
                let san_proxy = sanitizer.value(interaction.options.get('proxy').value, 'str').toLowerCase();
                let color = '#FFFFFF';
                let avatar = '<:compass:1307198358879993866>';
                try {
                    color = sanitizer.value(interaction.options.get('color').value, 'str');
                } catch (err) {
                    //
                }
                try {
                    let url = sanitizer.value(interaction.options.get('avatar').value, 'str');
                    let isValidURL = checkURL(url);
                    if (isValidURL) {
                        avatar = url
                    }
                } catch (err) {
                    //
                }
                let discid = interaction.user.id;

                createMember(discid, san_memname, san_proxy, color, avatar, pool, interaction).then(() => { pool.end(); });
            }
        } else {
            interaction.editReply({ content: `No system members found. Add some with /add.`, ephemeral: true })
        }
        if (conn) {
            conn.end();
        }
    }

    if (interaction.commandName === 'proxy') {

        await interaction.deferReply();

        let san_discid = sanitizer.value(interaction.user.id, 'str');

        let proxy = interaction.options.get('proxy').value.toLowerCase();
        let message = interaction.options.get('message').value;

        handleProxying(proxy, message, san_discid, pool, interaction);
    }
})

client.login(process.env.TOKEN);
