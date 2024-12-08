import Session from "@local/shared/session";
import api from "../../api";
import { ItemMessageType } from "../../api/item";
import BaseItem from "../../baseobject/item";
import { ContentType } from "../../content";
import game from "../../game";
import { GameObjectType } from "../../gameobject";
import Monster from "../../gameobject/monster";
import { SendersType } from "../../senders";
import { ChatType, Color } from "../../system/core/chat";
import { ZoneType } from "../../world";
import { Buff, BuffOrigin } from "./buff";
import { Modifier, ModifierType, Statistic } from "./statistic";

const commands = {
    "help": {
        "description": "Displays a list of commands.",
        "usage": "/help",
        execute: (args: string[], session: Session<SendersType>) => {
            const availableCommands = Object.keys(commands)
                .filter(command => command !== "help")
                .map(command => {
                    return commands[command as keyof typeof commands].usage;
                });

            for (let i = 0; i < availableCommands.length; i++) {
                api.chat.message({
                    chatType: ChatType.Whisper,
                    text: availableCommands[i]!,
                    senderCharacter: '',
                    receiverCharacter: session.character
                });
            }
        }
    },
    "speedup": {
        "description": "Speeds up the character by a given amount",
        "usage": "/speedup <speed>",
        execute: (args: string[], session: Session<SendersType>) => {
            const speed = parseFloat(args[0] || '0');
            const character = session.character!;

            // remove previous speed buff
            const prevRunSpeedBuff = character.buffs.find(BuffOrigin.Command, '/speedup');

            if (prevRunSpeedBuff)
                character.buffs.remove(prevRunSpeedBuff);


            const runSpeedBefore = character.statistics.runSpeed.getTotalValue();
            const runSpeedBuff = new Buff(character, BuffOrigin.Command, '/speedup', [
                [character.statistics.runSpeed, new Modifier(ModifierType.Additive, speed)]
            ]);

            character.buffs.add(runSpeedBuff);
            api.chat.system(character, `Applied running speed buff (${runSpeedBefore} >> ${character.statistics.runSpeed.getTotalValue()})`, Color.LightSeaGreen);
        }
    },
    "itemdrop": {
        "description": "Drops an item",
        "usage": "/itemdrop <itemId> <amount> <plus>",
        execute: async (args: string[], session: Session<SendersType>) => {
            const itemId = parseInt(args[0] || '0');
            const amount = parseInt(args[1] || '0');
            const plus = parseInt(args[2] || '0');

            if (!itemId)
                return;

            const character = session.character!;
            const itemUid = await api.item.create({
                id: itemId,
                owner: character,
                stack: amount || 1,
                plus: plus || 0
            });

            // TODO: log and raise error message
            if (!itemUid)
                return;

            session.send.item({
                subType: ItemMessageType.Drop,
                itemUid: itemUid,
                itemId: itemId,
                stack: amount || 1,
                position: character.position,
                objType: 1,
                objUid: character.uid,
                alive: 0 // TODO: implement
            });

            api.chat.system(character, `Item created (uid: ${itemUid}, id: ${itemId})`, Color.LightSeaGreen);
        }
    },
    "itemget": {
        "description": "Gets an item",
        "usage": "/itemget <itemId> <amount> <plus>",
        execute: async (args: string[], session: Session<SendersType>) => {
            const itemId = parseInt(args[0] || '0');
            const amount = parseInt(args[1] || '0');
            const plus = parseInt(args[2] || '0');
            const character = session.character!;

            const itemUid = await api.item.create({
                id: itemId,
                owner: character,
                stack: amount || 1,
                plus: plus || 0,
                into: 'inventory'
            });

            api.chat.system(character, `Item created (uid: ${itemUid}, id: ${itemId})`, Color.LightSeaGreen);
        }
    },
    "search": {
        "description": "Search for content by name",
        "usage": "/search <contentType> <itemName> <?page> <?itemsPerPage>",
        execute: async (args: string[], session: Session<SendersType>) => {
            const contentTypeMap = {
                'item': ContentType.Item,
                'monster': ContentType.Monster,
                'npc': ContentType.NPC
            };
            const character = session.character!;

            const arg0 = args[0]?.toLowerCase() as keyof typeof contentTypeMap | undefined;
            if (!arg0) {
                api.chat.system(character, 'Please provide a content type', Color.IndianRed);
                return;
            }

            const contentType = contentTypeMap[arg0];
            if (contentType === undefined) {
                api.chat.system(character, 'Please provide a valid content type', Color.IndianRed);
                return;
            }

            const text = args[1] ? args[1].toLowerCase() : '';

            if (!text) {
                api.chat.system(character, 'Please provide a search term', Color.IndianRed);
                return;
            }

            const content = game.content.filter(contentType, (item: BaseItem) => item.name.toLowerCase().includes(text.toLowerCase()));

            // pagination
            const page = args[2] ? parseInt(args[2]) : 1;
            const contentPerPage = args[3] ? parseInt(args[3]) : 10;
            const start = (page - 1) * contentPerPage;
            const end = start + contentPerPage;
            const paginatedItems = content.slice(start, end);
            const totalPages = Math.ceil(content.length / contentPerPage);

            api.chat.message({
                chatType: ChatType.Whisper,
                text: `Search results for "${text}" ${page <= totalPages ? `| Page ${page} of ${totalPages}` : ''}`,
                senderCharacter: '',
                receiverCharacter: session.character
            });

            if (!paginatedItems.length) {
                api.chat.system(character, `No results found`, Color.IndianRed);
                return;
            }

            for (const item of paginatedItems) {
                api.chat.message({
                    chatType: ChatType.Whisper,
                    text: `ID: ${item.id} [${item.name}]`,
                    senderCharacter: '',
                    receiverCharacter: session.character
                });
            }
        }
    },
    "spawn": {
        "description": "Spawns a monster or npc",
        "usage": "/spawn <monsterId>",
        execute: (args: string[], session: Session<SendersType>) => {
            // TODO: Spawn NPCs
            const contentId = parseInt(args[0] || '0');
            const character = session.character!;

            // find monster from database by id
            const baseMonster = game.content.monsters.find((m) => m.id === contentId);

            if (!baseMonster) {
                api.chat.system(character, `Not found monster with id ${contentId}`, Color.IndianRed);
                return;
            }

            const monster = new Monster({
                id: baseMonster.id,
                flags: baseMonster.flags,
                level: baseMonster.level,
                zone: character.zone,
                position: character.position,
                respawnTime: 0, // TODO:
                //@ts-ignore
                statistics: {
                    health: baseMonster.statistics.health,
                    maxHealth: new Statistic(baseMonster.statistics.health),
                    mana: baseMonster.statistics.mana,
                    maxMana: new Statistic(baseMonster.statistics.mana),
                    attack: new Statistic(baseMonster.statistics.attack),
                    magicAttack: new Statistic(baseMonster.statistics.magicAttack),
                    defense: new Statistic(baseMonster.statistics.defense),
                    magicResist: new Statistic(baseMonster.statistics.magicResist),
                    walkSpeed: new Statistic(baseMonster.statistics.walkSpeed),
                    runSpeed: new Statistic(baseMonster.statistics.runSpeed),
                    attackRange: new Statistic(baseMonster.statistics.attackRange),
                    attackSpeed: new Statistic(baseMonster.statistics.attackSpeed),
                },
                statpoints: {
                    strength: baseMonster.statistics.strength,
                    dexterity: baseMonster.statistics.dexterity,
                    intelligence: baseMonster.statistics.intelligence,
                    condition: baseMonster.statistics.condition,
                }
            });

            game.world.add(GameObjectType.Monster, ZoneType.Juno, monster);
            monster.appear(character);

            api.chat.system(character, `Spawned monster ${contentId}`, Color.LightSeaGreen);
        }
    },
    "hp": {
        "description": "Set character's health points by percentage or value (can't exceed max health points)",
        "usage": "/hp <percentOrValue>",
        execute: (args: string[], session: Session<SendersType>) => {
            const arg0 = args[0] || '100%';
            const percentage = arg0.includes('%');
            const character = session.character!;

            let value = 0;
            if (percentage) {
                value = parseInt(arg0.replace('%', ''));
                value = character.statistics.maxHealth.getTotalValue() * (value / 100);
            }
            else {
                value = parseInt(arg0);
            }

            if (value < 1) {
                api.chat.system(character, `Please provide a valid value`, Color.IndianRed);
                return;
            }

            if (value > character.statistics.maxHealth.getTotalValue()) {
                api.chat.system(character, `Health value can't exceed max health points`, Color.IndianRed);
                return;
            }

            character.statistics.health = value;
            character.updateStatistics();

            api.chat.system(character, `Set health points to ${value}`, Color.LightSeaGreen);
        }
    }

}

export default commands;
