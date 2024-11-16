require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
    {
        name: `system`,
        description: `Edit your system.`,
        integration_types: [0, 1],
        contexts: [1, 2],
        options: [
            {
                name: 'create',
                description: 'Create a new system. (Only 1 system per user.)',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'sysname',
                        description: `System name?`,
                        type: ApplicationCommandOptionType.String,
                        required: true
                    }
                ]
            },
            {
                name: 'name',
                description: 'Change system name.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'name',
                        description: 'New name?',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    }
                ]
            },
            {
                name: 'delete',
                description: 'Delete the entire system, including all members.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'confirmdelete',
                        description: `If you're sure, type your current system name here and press Enter.`,
                        type: ApplicationCommandOptionType.String,
                        required: true
                    }
                ]
            }
        ]
    },
    {
        name: `help`,
        description: `Shows help and setup info.`,
        integration_types: [0, 1],
        contexts: [1, 2],
    },
    {
        name: `proxy`,
        description: `Send a proxied message.`,
        integration_types: [0, 1],
        contexts: [1, 2],
        options: [
            {
                name: 'proxy',
                description: 'Member proxy?',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'message',
                description: 'Message?',
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    {
        name: 'view',
        description: 'View your system or a member of your system.',
        integration_types: [0, 1],
        contexts: [1, 2],
        options: [
            {
                name: 'system',
                description: 'View your system.',
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'member',
                description: 'View a specific member of your system.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'name',
                        description: 'Who to view?',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    }
                ]
            }
        ]
    },
    {
        name: 'member',
        description: `Edit or delete a member.`,
        integration_types: [0, 1],
        contexts: [1, 2],
        options: [
            {
                name: `add`,
                description: `Add someone to the system file. (Only name is REQUIRED)`,
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'name',
                        description: 'Who to add?',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    },
                    {
                        name: 'proxy',
                        description: 'What is their proxy? (Case insensitive - "A" and "a" are treated the same)',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    },
                    {
                        name: 'avatar',
                        description: 'Avatar URL or emoji ID?',
                        type: ApplicationCommandOptionType.String,
                        required: false
                    },
                    {
                        name: 'color',
                        description: `Enter a hex color (optional)`,
                        type: ApplicationCommandOptionType.String,
                        required: false
                    }
                ]
            },
            {
                name: `name`,
                description: `Change a member's name.`,
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'name',
                        description: 'Member to edit?',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    },
                    {
                        name: 'newname',
                        description: 'New name?',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    }
                ]
            },
            {
                name: `color`,
                description: `Change a member's color.`,
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'name',
                        description: 'Member to edit?',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    },
                    {
                        name: 'color',
                        description: 'New color?',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    }
                ]
            },
            {
                name: `proxy`,
                description: `Change a member's proxy.`,
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'name',
                        description: 'Member to edit?',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    },
                    {
                        name: 'proxy',
                        description: 'New proxy? (Case insensitive - "A" and "a" are treated the same)',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    }
                ]
            },
            {
                name: `avatar`,
                description: `Change a member's avatar.`,
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'name',
                        description: 'Member to edit?',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    },
                    {
                        name: 'avatar',
                        description: 'New avatar? (URL or Emoji ID)',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    }
                ]
            },
            {
                name: `delete`,
                description: `Remove a member's listing.`,
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'name',
                        description: 'Member to remove?',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    }
                ]
            }
        ]
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Registering commands...')
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        )
        console.log('Commands registered!')
    } catch (error) {
        console.log(error);
    }
})();