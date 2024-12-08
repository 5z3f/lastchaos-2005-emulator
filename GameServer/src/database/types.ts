// TODO: nullable columns

export type TableAccounts = {
    id: number;
    enabled: number;
    username: string;
    hash: string;
    createdAt: Date;
};

export type TableBanlog = {
    id: number;
    accountId: number;
    reason: string;
    proof: string;
    expiresAt: Date;
    bannedAt: Date;
};

export type TableCharacters = {
    id: number;
    accountId: number;
    face: number;
    hair: number;
    nickname: string;
    level: number;
    class: number;
    profession: number;
    experience: number;
    skillpoints: number;
    recentHealth: number;
    recentMana: number;
    strength: number;
    dexterity: number;
    intelligence: number;
    condition: number;
    statpoints: number;
    role: number;
    updatedAt: Date;
    createdAt: Date;
};

export type TableChatlog = {
    id: number;
    type: number;
    sender: number;
    receiver: number;
    text: string;
    sent: number;
    createdAt: Date;
};

export type TableFriends = {
    id: number;
    id2: number;
    group: string;
    updatedAt: Date;
    createdAt: Date;
};

export type TableGoldflow = {
    id: number;
    from: string;
    to: string;
    amount: number;
    position: string;
    transferAt: Date;
};

export type TableInvites = {
    id: number;
    type: number;
    requester: number;
    receiver: number;
    accepted: number;
    resolvedAt: Date;
    createdAt: Date;
};

export type TableItemflow = {
    id: number;
    uid: number;
    from: string;
    to: string;
    position: string;
    transferAt: Date;
};

export type TableItems = {
    /** This is a unique virtual identifier. */
    id: number;
    parentId: number;
    itemId: number;
    accountId: number;
    charId: number;
    /** 0 = Ground / 1 = Inventory / 2 = Warehouse */
    place: number;
    position: string;
    plus: number;
    wearingPosition: number;
    seals: string;
    removed: number;
    updatedAt: Date;
    createdAt: Date;
};

export type TableMessages = {
    id: number;
    type: string;
    from: number;
    to: number;
    message: string;
    createdAt: Date;
};

export type TableQuickslot = {
    id: number;
    page: number;
    slot1: string;
    slot2: string;
    slot3: string;
    slot4: string;
    slot5: string;
    slot6: string;
    slot7: string;
    slot8: string;
    slot9: string;
    slot10: string;
};
