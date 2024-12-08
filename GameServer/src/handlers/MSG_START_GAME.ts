import log from '@local/shared/logger';
import Message from '@local/shared/message';
import Session from '@local/shared/session';
import { ItemWearingPosition } from '../api/item';
import database from '../database';
import game from '../game';
import { CharacterEvents, GameObjectEvents, GameObjectType } from '../gameobject';
import Character, { ClassType } from '../gameobject/character';
import NPC from '../gameobject/npc';
import { SendersType } from '../senders';
import { EnvMessageType } from '../senders/env';
import { InventoryItem } from '../system/core/inventory';
import { QUICKSLOT_MAXSLOT, QUICKSLOT_PAGE_NUM } from '../system/core/quickslot';
import { ExtendMessageType, ExtendMessengerType } from './MSG_EXTEND';
import { FriendMessageType, FriendStatusType } from './MSG_FRIEND';
import { QuickSlotMessageType } from './MSG_QUICKSLOT';

function handleObjectAppearance(character: Character, objectPoints) {
    objectPoints.forEach((apo) => {
        if (apo.type !== GameObjectType.Monster)
            return;

        const gameObject = game.world.find(apo.type, (o) => o.uid === apo.uid);

        if (gameObject.state.dead)
            return;

        if (gameObject?.zone.id != character.zone.id)
            return;

        if (character.isObjectVisible(apo.type, apo.uid))
            return;

        gameObject.appear(character);
    });
}

function handleObjectDisappearance(character: Character, objectPoints) {
    for (let objType of Object.keys(character.visibleObjectUids)) {
        const objectUids = character.visibleObjectUids[objType];

        for (let objUid of objectUids) {
            const inVisionRange = !!objectPoints.find((o) => o.type == objType && o.uid == objUid);

            // TODO: dont disappear objects that are in vision range of party members (if you are close to them - 100~150 units)
            if (!inVisionRange) {
                //@ts-ignore
                const gameObject = game.world.find(objType, (o) => o.uid == objUid);

                // TODO: this condition will likely disappear when the character will be added to the session
                if ((objType === GameObjectType.Character && gameObject.uid === character.uid) || objType === GameObjectType.NPC)
                    continue;

                if (gameObject.state.dead)
                    continue;

                if (gameObject?.zone.id != character.zone.id)
                    continue;

                gameObject.disappear(character);
            }
        }
    }
}

// TODO: move the most of it somewhere else
export default async function (session: Session<SendersType>, msg: Message) {
    const character = session.character!;
    character.spawn();

    // setup object visibility
    {
        const visionRange = 150;
        character.on(GameObjectEvents.Move, (pos) => {
            const objectPoints = character.zone.getObjectsInArea(pos.x, pos.y, visionRange);
            handleObjectAppearance(character, objectPoints);
            handleObjectDisappearance(character, objectPoints);
        });
    }

    // setup and send inventory to client
    {
        const dbInventoryItems = await database.characters.getInventoryItems(character.id);
        const inventoryStacks: any[][] = [];

        for (const dbInventoryItem of dbInventoryItems!) {
            if (dbInventoryItem.parentId !== null) {
                if (!inventoryStacks[dbInventoryItem.parentId])
                    inventoryStacks[dbInventoryItem.parentId] = [];

                inventoryStacks[dbInventoryItem.parentId].push(dbInventoryItem);
            }
            else {
                if (!inventoryStacks[dbInventoryItem.id])
                    inventoryStacks[dbInventoryItem.id] = [];

                inventoryStacks[dbInventoryItem.id].push(dbInventoryItem);
            }
        }

        function isArmor(wearingPosition: number) {
            return wearingPosition === ItemWearingPosition.Helmet ||
                wearingPosition === ItemWearingPosition.Shirt ||
                wearingPosition === ItemWearingPosition.Pants ||
                wearingPosition === ItemWearingPosition.Shield ||
                wearingPosition === ItemWearingPosition.Gloves ||
                wearingPosition === ItemWearingPosition.Boots;
        }

        function isWeapon(wearingPosition: number) {
            return wearingPosition === ItemWearingPosition.Weapon;
        }

        for (let invenStack in inventoryStacks) {
            const inventoryStack = inventoryStacks[invenStack];
            const firstStackItem = inventoryStack[0];

            const baseItem = game.content.items.find((el) => el.id == firstStackItem.itemId);

            if (!baseItem) {
                log.debug(`Server attempted to add an item to character inventory that does not exist. ID: ${firstStackItem.itemId}`);
                continue;
            }

            const stackUids = inventoryStack.map((i) => i.id);

            const invenRow = new InventoryItem({
                itemUid: firstStackItem.id,
                baseItem: baseItem,
                stack: (inventoryStacks[invenStack].length > 1) ? inventoryStacks[invenStack].length : 1,
                plus: firstStackItem.plus,
                wearingPosition: firstStackItem.wearingPosition,
                options: firstStackItem.seals,
                stackUids: stackUids
            });

            const [tab, col, row] = firstStackItem.position.split(',');

            character.inventory.addToPosition(invenRow, tab, col, row);

            // emit equip event if item is armor or weapon at start
            if (isArmor(firstStackItem.wearingPosition) || isWeapon(firstStackItem.wearingPosition)) {
                character.emit(CharacterEvents.InventoryEquip, invenRow);
            }
        }

        session.send.inventory(character.inventory);
    }

    // send stats to client
    character.updateStatistics();

    // send test skills
    {
        session.send.skill(0, {
            skillId: 230
        });

        session.send.skill(0, {
            skillId: 163
        });
    }

    // load quickslot from databasez
    {
        const dbQuickslotPages = await database.quickslot.get(character.id);

        if (!dbQuickslotPages!.length) {
            for (let i = 0; i < QUICKSLOT_PAGE_NUM; i++)
                await database.quickslot.createPage(character.id, i, character.quickslot.quickSlots[i])
        }

        for (const dbQuickslotPage of dbQuickslotPages!) {
            for (let i = 1; i <= QUICKSLOT_MAXSLOT; i++) {
                const key = `slot${i}`;
                const [slotTypeId, value1, value2] = dbQuickslotPage[key].split(',');

                character.quickslot.add({
                    pageId: Number(dbQuickslotPage.page),
                    slotId: i - 1,
                    slotType: Number(slotTypeId),
                    value1: Number(value1),
                    value2: Number(value2),
                    updateDb: false,
                    sendPacket: false
                });
            }
        }

        // send quickslot pages to client
        for (let i = 0; i < QUICKSLOT_PAGE_NUM; i++)
            session.send.quickslot(QuickSlotMessageType.List, { pageId: i });
    }

    // messenger related stuff (TODO: it should be moved into some init/postinit function/entergame event)
    {
        // TODO: implement multiple groups
        session.send.extend({
            subType: ExtendMessageType.Messenger,
            thirdType: ExtendMessengerType.GroupList,
            groupCount: 1,
            groupId: 0,
            groupName: 'Friends'
        });

        const helperNames = {
            [ClassType.Titan]: "Bronn, the Boundless",
            [ClassType.Knight]: "Aldric, the Valiant",
            [ClassType.Healer]: "Elara, Nature's Hand",
            [ClassType.Mage]: "Thalos, Master of Mysteries",
            [ClassType.Rogue]: "Raven, the Shadowstep",
            [ClassType.Sorcerer]: "Xanthe, the Darkflare"
        };

        // Add our helper to friends list
        session.send.friend({
            subType: FriendMessageType.NotifyAdd,
            uid: 0,
            nickname: helperNames[character.classType],
            class: character.classType,
            status: FriendStatusType.Online
        });

        // send friends to client
        for (let friend of character.messenger.friends)
            friend.show();

        // set my messenger status to online
        character.messenger.status = FriendStatusType.Online;
    }

    // send current time
    session.send.env({
        subType: EnvMessageType.Time,
        year: 0,
        month: 0,
        day: 0,
        hour: 3,
        startTime: 0
    });

    // FIXME: all npcs are spawned only once per session
    const result = game.world.filter(GameObjectType.NPC, (n: NPC) => n.zone.id === character.zone.id) as NPC[];

    for (let npc of result)
        npc.appear(character.session);
}
