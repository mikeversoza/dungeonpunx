// ============================================================
// DUNGEON CRAWL - Shared Game Engine
// ============================================================

const DungeonEngine = (() => {

  // ---- STORAGE ----
  const STORE = {
    get: (k) => { try { return JSON.parse(localStorage.getItem('dc_' + k)); } catch { return null; } },
    set: (k, v) => localStorage.setItem('dc_' + k, JSON.stringify(v)),
    del: (k) => localStorage.removeItem('dc_' + k)
  };

  // ---- AUTH ----
  const AUTH = {
    PASSWORD: 'dungeon2024',
    check: () => STORE.get('auth') === true,
    login: (pw) => { if (pw === AUTH.PASSWORD) { STORE.set('auth', true); return true; } return false; },
    logout: () => STORE.del('auth')
  };

  // ---- DICE ENGINE ----
  const DICE = {
    roll: (sides) => Math.floor(Math.random() * sides) + 1,
    rollN: (n, sides) => Array.from({length: n}, () => DICE.roll(sides)),
    rollSum: (n, sides) => DICE.rollN(n, sides).reduce((a,b) => a+b, 0),
    modifier: (score) => Math.floor((score - 10) / 2),
    modStr: (score) => { const m = DICE.modifier(score); return (m >= 0 ? '+' : '') + m; },
    advantage: (sides) => Math.max(DICE.roll(sides), DICE.roll(sides)),
    disadvantage: (sides) => Math.min(DICE.roll(sides), DICE.roll(sides)),
  };

  // ---- D&D 5E DATA ----
  const D5E = {
    proficiencyBonus: (level) => Math.ceil(level / 4) + 1,
    xpThresholds: {
      1: {easy:25,medium:50,hard:75,deadly:100},
      2: {easy:50,medium:100,hard:150,deadly:200},
      3: {easy:75,medium:150,hard:225,deadly:400},
      4: {easy:125,medium:250,hard:375,deadly:500},
      5: {easy:250,medium:500,hard:750,deadly:1100},
      6: {easy:300,medium:600,hard:900,deadly:1400},
      7: {easy:350,medium:750,hard:1100,deadly:1700},
      8: {easy:450,medium:900,hard:1400,deadly:2100},
      9: {easy:550,medium:1100,hard:1600,deadly:2400},
      10:{easy:600,medium:1200,hard:1900,deadly:2800},
      11:{easy:800,medium:1600,hard:2400,deadly:3600},
      12:{easy:1000,medium:2000,hard:3000,deadly:4500},
      13:{easy:1100,medium:2200,hard:3400,deadly:5100},
      14:{easy:1250,medium:2500,hard:3800,deadly:5700},
      15:{easy:1400,medium:2800,hard:4300,deadly:6400},
      16:{easy:1600,medium:3200,hard:4800,deadly:7200},
      17:{easy:2000,medium:3900,hard:5900,deadly:8800},
      18:{easy:2100,medium:4200,hard:6300,deadly:9500},
      19:{easy:2400,medium:4900,hard:7300,deadly:10900},
      20:{easy:2800,medium:5700,hard:8500,deadly:12700},
    },
    xpByLevel: [0,300,900,2700,6500,14000,23000,34000,48000,64000,85000,100000,120000,140000,165000,195000,225000,265000,305000,355000],
    hitDice: {Barbarian:12,Fighter:10,Paladin:10,Ranger:10,Bard:8,Cleric:8,Druid:8,Monk:8,Rogue:8,Warlock:8,Sorcerer:6,Wizard:6},
    classes: ['Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard'],
    races: ['Human','Elf','Dwarf','Halfling','Gnome','Half-Orc','Half-Elf','Tiefling','Dragonborn','Aasimar','Tabaxi'],
    alignments: ['Lawful Good','Neutral Good','Chaotic Good','Lawful Neutral','True Neutral','Chaotic Neutral','Lawful Evil','Neutral Evil','Chaotic Evil'],
    skills: ['Acrobatics','Animal Handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival'],
    savingThrows: ['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'],
    abilityScores: ['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'],
    abilityAbbr: {Strength:'STR',Dexterity:'DEX',Constitution:'CON',Intelligence:'INT',Wisdom:'WIS',Charisma:'CHA'},
    skillAbility: {
      Acrobatics:'Dexterity',Athletics:'Strength','Animal Handling':'Wisdom',Arcana:'Intelligence',
      Deception:'Charisma',History:'Intelligence',Insight:'Wisdom',Intimidation:'Charisma',
      Investigation:'Intelligence',Medicine:'Wisdom',Nature:'Intelligence',Perception:'Wisdom',
      Performance:'Charisma',Persuasion:'Charisma',Religion:'Intelligence','Sleight of Hand':'Dexterity',
      Stealth:'Dexterity',Survival:'Wisdom'
    },
    conditions: ['Blinded','Charmed','Deafened','Exhaustion','Frightened','Grappled','Incapacitated','Invisible','Paralyzed','Petrified','Poisoned','Prone','Restrained','Stunned','Unconscious'],

    // Monster templates by CR
    monsters: [
      {name:"Goblin",cr:"1/4",hp:7,ac:15,attack:"+4",damage:"1d6+2",xp:50,type:"humanoid",size:"Small"},
      {name:"Kobold",cr:"1/8",hp:5,ac:12,attack:"+4",damage:"1d4+2",xp:25,type:"humanoid",size:"Small"},
      {name:"Skeleton",cr:"1/4",hp:13,ac:13,attack:"+4",damage:"1d6+2",xp:50,type:"undead",size:"Medium"},
      {name:"Zombie",cr:"1/4",hp:22,ac:8,attack:"+3",damage:"1d6+1",xp:50,type:"undead",size:"Medium"},
      {name:"Giant Rat",cr:"1/8",hp:7,ac:12,attack:"+4",damage:"1d4+2",xp:25,type:"beast",size:"Small"},
      {name:"Wolf",cr:"1/4",hp:11,ac:13,attack:"+4",damage:"2d4+2",xp:50,type:"beast",size:"Medium"},
      {name:"Orc",cr:"1/2",hp:15,ac:13,attack:"+5",damage:"1d12+3",xp:100,type:"humanoid",size:"Medium"},
      {name:"Hobgoblin",cr:"1/2",hp:11,ac:18,attack:"+3",damage:"1d8+1",xp:100,type:"humanoid",size:"Medium"},
      {name:"Bugbear",cr:"1",hp:27,ac:16,attack:"+4",damage:"2d8+2",xp:200,type:"humanoid",size:"Medium"},
      {name:"Cultist",cr:"1/8",hp:9,ac:12,attack:"+3",damage:"1d6+1",xp:25,type:"humanoid",size:"Medium"},
      {name:"Cult Fanatic",cr:"2",hp:33,ac:13,attack:"+4",damage:"2d6+2",xp:450,type:"humanoid",size:"Medium"},
      {name:"Gnoll",cr:"1/2",hp:22,ac:15,attack:"+4",damage:"2d6+2",xp:100,type:"humanoid",size:"Medium"},
      {name:"Shadow",cr:"1/2",hp:16,ac:12,attack:"+4",damage:"2d6+2",xp:100,type:"undead",size:"Medium"},
      {name:"Specter",cr:"1",hp:22,ac:12,attack:"+4",damage:"3d6",xp:200,type:"undead",size:"Medium"},
      {name:"Ghoul",cr:"1",hp:22,ac:12,attack:"+2",damage:"2d6+2",xp:200,type:"undead",size:"Medium"},
      {name:"Wight",cr:"3",hp:45,ac:14,attack:"+4",damage:"1d6+2",xp:700,type:"undead",size:"Medium"},
      {name:"Banshee",cr:"4",hp:58,ac:12,attack:"+4",damage:"3d6+3",xp:1100,type:"undead",size:"Medium"},
      {name:"Werewolf",cr:"3",hp:58,ac:11,attack:"+4",damage:"2d6+3",xp:700,type:"humanoid",size:"Medium"},
      {name:"Troll",cr:"5",hp:84,ac:15,attack:"+7",damage:"2d6+4",xp:1800,type:"giant",size:"Large"},
      {name:"Ogre",cr:"2",hp:59,ac:11,attack:"+6",damage:"2d8+4",xp:450,type:"giant",size:"Large"},
      {name:"Stone Golem",cr:"10",hp:178,ac:17,attack:"+10",damage:"3d10+6",xp:5900,type:"construct",size:"Large"},
      {name:"Mimic",cr:"2",hp:58,ac:12,attack:"+5",damage:"1d8+3",xp:450,type:"monstrosity",size:"Medium"},
      {name:"Gelatinous Cube",cr:"2",hp:84,ac:6,attack:"+4",damage:"3d6",xp:450,type:"ooze",size:"Large"},
      {name:"Owlbear",cr:"3",hp:59,ac:13,attack:"+7",damage:"2d8+5",xp:700,type:"monstrosity",size:"Large"},
      {name:"Basilisk",cr:"3",hp:52,ac:15,attack:"+5",damage:"2d6+3",xp:700,type:"monstrosity",size:"Medium"},
      {name:"Medusa",cr:"6",hp:127,ac:15,attack:"+5",damage:"1d6+3",xp:2300,type:"monstrosity",size:"Medium"},
      {name:"Mind Flayer",cr:"7",hp:71,ac:15,attack:"+7",damage:"2d10+4",xp:2900,type:"aberration",size:"Medium"},
      {name:"Beholder",cr:"13",hp:180,ac:18,attack:"+9",damage:"4d10",xp:10000,type:"aberration",size:"Large"},
      {name:"Dragon (Young Red)",cr:"10",hp:178,ac:18,attack:"+10",damage:"2d10+6",xp:5900,type:"dragon",size:"Large"},
      {name:"Lich",cr:"21",hp:135,ac:17,attack:"+12",damage:"4d8+5",xp:33000,type:"undead",size:"Medium"},
      {name:"Vampire",cr:"13",hp:144,ac:16,attack:"+9",damage:"1d8+4",xp:10000,type:"undead",size:"Medium"},
      {name:"Flesh Golem",cr:"5",hp:93,ac:9,attack:"+7",damage:"2d8+4",xp:1800,type:"construct",size:"Large"},
      {name:"Drow",cr:"1/4",hp:13,ac:15,attack:"+4",damage:"1d6+2",xp:50,type:"humanoid",size:"Medium"},
      {name:"Yuan-ti Pureblood",cr:"1",hp:40,ac:11,attack:"+3",damage:"2d6+1",xp:200,type:"humanoid",size:"Medium"},
    ],

    lootTables: {
      common: ['Copper coins (2d10 cp)','Silver coins (1d6 sp)','Torch','Rope (50ft)','Rations (1d4 days)','Candle','Chalk','Flint and steel','Sack','Waterskin','Parchment','Ink','Sealing wax','Crowbar','Hammer'],
      uncommon: ['Gold coins (2d10 gp)','Potion of Healing','Thieves\' tools','Healer\'s kit','Lantern','Antitoxin','Magnifying glass','Spellbook (blank)','Climber\'s kit','Disguise kit','Fine clothes','Silver dagger','Tinderbox','Block and tackle'],
      rare: ['Gold coins (10d10 gp)','Potion of Greater Healing','+1 Arrow (5)','Spell Scroll (level 1)','Gem (50 gp)','Platinum coins (1d10 pp)','Potion of Animal Friendship','Dust of Disappearance','Necklace of fireballs','Eyes of the eagle'],
      veryRare: ['+1 Weapon','+1 Armor','Ring of Protection','Cloak of Elvenkind','Boots of Speed','Belt of Giant Strength','Staff of the Magi (cracked)','Wand of Magic Missiles','Bracers of Defense','Necklace of Adaptation','Gem (500 gp)'],
      legendary: ['+2 Weapon','+2 Armor','Ring of Regeneration','Cloak of Displacement','Vorpal Sword','Holy Avenger','Robe of the Archmagi','Staff of Power','Tome of Clear Thought','Ioun Stone (Leadership)']
    },

    getLootByLevel: (level) => {
      const roll = DICE.roll(100);
      if (level <= 4) {
        if (roll <= 60) return D5E.lootTables.common[DICE.roll(D5E.lootTables.common.length)-1];
        if (roll <= 90) return D5E.lootTables.uncommon[DICE.roll(D5E.lootTables.uncommon.length)-1];
        return D5E.lootTables.rare[DICE.roll(D5E.lootTables.rare.length)-1];
      } else if (level <= 10) {
        if (roll <= 40) return D5E.lootTables.uncommon[DICE.roll(D5E.lootTables.uncommon.length)-1];
        if (roll <= 80) return D5E.lootTables.rare[DICE.roll(D5E.lootTables.rare.length)-1];
        return D5E.lootTables.veryRare[DICE.roll(D5E.lootTables.veryRare.length)-1];
      } else {
        if (roll <= 40) return D5E.lootTables.rare[DICE.roll(D5E.lootTables.rare.length)-1];
        if (roll <= 75) return D5E.lootTables.veryRare[DICE.roll(D5E.lootTables.veryRare.length)-1];
        return D5E.lootTables.legendary[DICE.roll(D5E.lootTables.legendary.length)-1];
      }
    },

    getEncounterXP: (players, avgLevel) => {
      const thresh = D5E.xpThresholds[Math.min(avgLevel, 20)];
      const totalPlayers = players.length || 1;
      const multipliers = [1,1.5,2,2,2,2,2.5,2.5,2.5,3,3,4];
      const diff = ['easy','medium','hard','deadly'][DICE.roll(4)-1];
      return { xp: thresh[diff] * totalPlayers, difficulty: diff };
    },

    getMonstersByXP: (targetXP, count=1) => {
      // find monsters whose total XP is roughly targetXP
      const sorted = [...D5E.monsters].sort((a,b) => Math.abs(a.xp - targetXP/count) - Math.abs(b.xp - targetXP/count));
      const baseMonster = sorted[0];
      const num = Math.max(1, Math.min(8, Math.round(targetXP / baseMonster.xp)));
      return { monster: baseMonster, count: num };
    }
  };

  // ---- ROOM TEMPLATES ----
  const DEFAULT_ROOMS = [
    {
      id: 'r001', name: 'The Crypt of Whispers', type: 'combat',
      description: 'Crumbling stone walls weep moisture as ancient sarcophagi line the chamber. The air reeks of rot and forgotten centuries. Something stirs in the shadows.',
      flavor: 'As you enter, the temperature drops sharply. The torchlight flickers, casting dancing shadows across weathered stone faces carved into the walls.',
      exits: ['north','east'], minLevel: 1, maxLevel: 5
    },
    {
      id: 'r002', name: 'The Hall of Riddles', type: 'puzzle',
      description: 'Three stone doors line the far wall, each inscribed with a symbol: a flame, a wave, and a skull. A plaque reads: "Only the pure of element may pass."',
      flavor: 'Your footsteps echo strangely here. On the floor, faded chalk marks suggest others have puzzled over this room before.',
      puzzle: {
        question: 'The inscription reads: "I speak without a mouth and hear without ears. I have no body but come alive with wind. What am I?"',
        answer: 'echo',
        hint: 'Think about how sound behaves in empty spaces.',
        successLoot: true,
        failureTrap: {damage: '2d6', type: 'fire', save: 'DEX DC 13'}
      },
      exits: ['north','south'], minLevel: 1, maxLevel: 10
    },
    {
      id: 'r003', name: 'The Treasure Vault', type: 'treasure',
      description: 'Gold glimmers in the torchlight. Chests, urns, and scattered coins fill this chamber — but a thin wire crosses the threshold.',
      flavor: 'Someone has been here recently. Fresh boot prints in the dust lead to — and inexplicably away from — a large ornate chest.',
      exits: ['south'], minLevel: 2, maxLevel: 20
    },
    {
      id: 'r004', name: 'The Collapsed Corridor', type: 'exploration',
      description: 'Rubble chokes this passage. A narrow gap near the ceiling might allow a small creature through, or the whole mess could be cleared with enough muscle.',
      flavor: 'The sound of dripping water echoes from somewhere beyond the debris. Whatever caused this collapse, it wasn\'t recent.',
      exits: ['east','west'], minLevel: 1, maxLevel: 20
    },
    {
      id: 'r005', name: 'The Sacrificial Altar', type: 'combat',
      description: 'Dark stains mar the surface of a obsidian altar at the room\'s center. Cultist robes hang from iron pegs. The braziers still burn.',
      flavor: 'The symbol carved into the altar is unmistakable — this is no abandoned ruin. Someone uses this place still.',
      exits: ['north','south','west'], minLevel: 3, maxLevel: 10
    },
    {
      id: 'r006', name: 'The Flooded Chamber', type: 'exploration',
      description: 'Three feet of dark water fills the floor. Visibility beneath the surface is zero. Something long and pale moves near the far wall.',
      flavor: 'The water is unnaturally cold. Small glowing motes drift just beneath the surface, like the eyes of things watching from below.',
      exits: ['east','west'], minLevel: 1, maxLevel: 8
    },
    {
      id: 'r007', name: 'The Library of Lost Tomes', type: 'puzzle',
      description: 'Bookshelves tower to the ceiling, filled with rotting volumes. A central lectern holds an open book that seems to shift when you\'re not looking directly at it.',
      flavor: 'The room smells of old paper and something else — a sweetness that makes the back of your throat itch.',
      puzzle: {
        question: 'The book is open to a page that reads: "The more you take, the more you leave behind. What am I?"',
        answer: 'footsteps',
        hint: 'Think about what you leave in your wake as you travel.',
        successLoot: true,
        failureTrap: {damage: '3d6', type: 'psychic', save: 'INT DC 15'}
      },
      exits: ['south','east'], minLevel: 3, maxLevel: 15
    },
    {
      id: 'r008', name: 'The Barracks of the Damned', type: 'combat',
      description: 'Rows of moldering cots line this room. The undead soldiers who once slept here now stand at grim, eternal attention.',
      flavor: 'Their eyes are empty but their weapons are not. The clatter of bone against stone fills the chamber as they turn to face you.',
      exits: ['north','east'], minLevel: 2, maxLevel: 12
    },
    {
      id: 'r009', name: 'The Alchemist\'s Laboratory', type: 'treasure',
      description: 'Glass vessels bubble and smoke. Shelves of ingredients line the walls. The alchemist is gone — but the experiments continue.',
      flavor: 'A journal lies open on the workbench. The last entry reads: "Day 47. The formula is complete. God help me."',
      exits: ['west','south'], minLevel: 3, maxLevel: 20
    },
    {
      id: 'r010', name: 'The Throne Room', type: 'boss',
      description: 'A massive throne of iron and bone dominates the far wall. The creature that sits upon it has been waiting for you.',
      flavor: 'The temperature here is different — wrong. The thing on the throne smiles, and you realize it knew exactly when you entered the dungeon.',
      exits: ['south'], minLevel: 5, maxLevel: 20
    },
    {
      id: 'r011', name: 'The Mirror Hall', type: 'puzzle',
      description: 'Seven mirrors line the walls, each showing a slightly different reflection. One shows you dead. One shows the exit.',
      flavor: 'As you approach your reflection, it moves... half a second after you do.',
      puzzle: {
        question: 'A disembodied voice asks: "I have cities but no houses. I have mountains but no trees. I have water but no fish. I have roads but no cars. What am I?"',
        answer: 'map',
        hint: 'It represents something real but isn\'t real itself.',
        successLoot: false,
        failureTrap: {damage: '2d8', type: 'cold', save: 'CON DC 14'}
      },
      exits: ['north','south'], minLevel: 4, maxLevel: 20
    },
    {
      id: 'r012', name: 'The Mushroom Grove', type: 'exploration',
      description: 'Giant fungi fill this cavern, their caps glowing a sickly blue-green. Some are large enough to hide behind. Something has been eating them.',
      flavor: 'The spores in the air are thick. You can feel them on your tongue, sweet and slightly numbing.',
      exits: ['north','east','west'], minLevel: 1, maxLevel: 6
    },
    {
      id: 'r013', name: 'The Warden\'s Office', type: 'treasure',
      description: 'A desk of heavy stone sits in the corner, its drawers locked. Keys hang on iron hooks — but there are more keys than locks.',
      flavor: 'Wanted posters cover the walls. One of them has a crude drawing that looks disturbingly like one of your party members.',
      exits: ['north','west'], minLevel: 2, maxLevel: 20
    },
    {
      id: 'r014', name: 'The Summoning Circle', type: 'combat',
      description: 'A perfect circle of salt and ash fills the floor. Candles at each cardinal point burn with black flames. Something has already been summoned.',
      flavor: 'The air smells of sulfur and ozone. The circle is not meant to keep something in — it\'s meant to keep you out.',
      exits: ['south','east'], minLevel: 5, maxLevel: 20
    },
    {
      id: 'r015', name: 'The Beggar\'s Den', type: 'social',
      description: 'A haggard figure huddled against the wall looks up at your torchlight with hollow eyes. "Spare a copper?" they rasp. "I know things."',
      flavor: 'They wear the tattered remnants of a noble\'s coat. They\'ve been here a long time.',
      exits: ['north','east','west','south'], minLevel: 1, maxLevel: 20
    },
  ];

  // ---- GAME STATE ----
  const getDefaultState = () => ({
    started: false,
    players: [],
    currentRoom: null,
    visitedRooms: [],
    mapRooms: [],
    dungeonDepth: 0,
    turn: 0,
    log: [],
    loot: [],
    totalXP: 0,
    completed: false,
    allDead: false,
    dmMode: false,
    dungeonLevel: 1,
    maxRooms: 10,
  });

  const getState = () => STORE.get('gameState') || getDefaultState();
  const setState = (s) => STORE.set('gameState', s);
  const resetState = () => setState(getDefaultState());

  // ---- CHARACTERS ----
  const getCharacters = () => STORE.get('characters') || [];
  const saveCharacters = (chars) => STORE.set('characters', chars);

  const createCharacter = (data) => ({
    id: 'char_' + Date.now(),
    name: data.name || 'Unknown Hero',
    race: data.race || 'Human',
    class: data.class || 'Fighter',
    level: data.level || 1,
    xp: data.xp || 0,
    maxHP: data.maxHP || 10,
    currentHP: data.currentHP || data.maxHP || 10,
    tempHP: 0,
    ac: data.ac || 10,
    speed: data.speed || 30,
    initiative: data.initiative || 0,
    proficiencyBonus: D5E.proficiencyBonus(data.level || 1),
    inspiration: false,
    abilities: data.abilities || {Strength:10,Dexterity:10,Constitution:10,Intelligence:10,Wisdom:10,Charisma:10},
    savingThrows: data.savingThrows || [],
    skills: data.skills || [],
    conditions: [],
    inventory: data.inventory || [],
    loot: [],
    notes: data.notes || '',
    backstory: data.backstory || '',
    active: false,
  });

  // ---- DUNGEON GENERATION ----
  const generateMap = (players, dungeonLevel) => {
    const allRooms = getRooms();
    const roomCount = 8 + DICE.roll(5); // 9-13 rooms
    const eligible = allRooms.filter(r => r.minLevel <= dungeonLevel && r.maxLevel >= dungeonLevel);
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(roomCount, shuffled.length));

    // ensure boss if available
    const hasBoss = selected.some(r => r.type === 'boss');
    if (!hasBoss) {
      const bossRoom = allRooms.find(r => r.type === 'boss');
      if (bossRoom) selected[selected.length - 1] = bossRoom;
    }

    // build map grid
    const mapRooms = selected.map((room, i) => {
      const gridX = (i % 4) * 3;
      const gridY = Math.floor(i / 4) * 3;
      return {
        ...room,
        mapX: gridX,
        mapY: gridY,
        visited: i === 0,
        isStart: i === 0,
        isBoss: room.type === 'boss',
        connections: [],
        cleared: false,
      };
    });

    // connect rooms linearly with some branches
    for (let i = 1; i < mapRooms.length; i++) {
      const from = DICE.roll(Math.max(1, i)) - 1;
      if (!mapRooms[from].connections.includes(i)) mapRooms[from].connections.push(i);
      if (!mapRooms[i].connections.includes(from)) mapRooms[i].connections.push(from);
    }

    return mapRooms;
  };

  const getRooms = () => {
    const stored = STORE.get('customRooms') || [];
    return [...DEFAULT_ROOMS, ...stored];
  };

  const getCustomRooms = () => STORE.get('customRooms') || [];
  const saveCustomRooms = (rooms) => STORE.set('customRooms', rooms);

  // ---- ENCOUNTER GENERATION ----
  const generateEncounter = (room, players, dungeonLevel) => {
    const avgLevel = players.length > 0
      ? Math.round(players.reduce((s, p) => s + (p.level || 1), 0) / players.length)
      : dungeonLevel;

    const { xp, difficulty } = D5E.getEncounterXP(players, avgLevel);
    const { monster, count } = D5E.getMonstersByXP(xp);

    // scale HP slightly
    const hpMult = 0.8 + (avgLevel / 20) * 0.4;
    const monsters = Array.from({length: count}, (_, i) => ({
      ...monster,
      id: `m_${i}_${Date.now()}`,
      currentHP: Math.max(1, Math.round(monster.hp * hpMult)),
      maxHP: Math.max(1, Math.round(monster.hp * hpMult)),
      initiative: DICE.roll(20) + DICE.modifier(10),
    }));

    return { monsters, difficulty, xpReward: Math.round(xp / (players.length || 1)) };
  };

  // ---- LOG ----
  const addLog = (state, message, type='info') => {
    state.log = [{
      text: message,
      type,
      turn: state.turn,
      time: new Date().toLocaleTimeString()
    }, ...state.log].slice(0, 100);
  };

  return {
    AUTH, DICE, D5E, STORE,
    getState, setState, resetState,
    getCharacters, saveCharacters, createCharacter,
    getRooms, getCustomRooms, saveCustomRooms,
    generateMap, generateEncounter, addLog, getDefaultState,
    DEFAULT_ROOMS
  };
})();

// Make globally available
window.DungeonEngine = DungeonEngine;
