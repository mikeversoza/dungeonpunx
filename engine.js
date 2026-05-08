// ============================================================
// DUNGEONPUNX — Game Engine v2 (Firebase-backed)
// ============================================================

const DungeonEngine = (() => {

  const FB_URL = 'https://dungeon-8db6b-default-rtdb.firebaseio.com';

  const FB = {
    get: async (path) => {
      try { const r = await fetch(`${FB_URL}/${path}.json`); return r.ok ? r.json() : null; }
      catch { return null; }
    },
    set: async (path, data) => {
      try { await fetch(`${FB_URL}/${path}.json`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }); return true; }
      catch { return false; }
    },
    push: async (path, data) => {
      try { const r = await fetch(`${FB_URL}/${path}.json`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }); return r.ok ? r.json() : null; }
      catch { return null; }
    },
    del: async (path) => {
      try { await fetch(`${FB_URL}/${path}.json`, { method:'DELETE' }); return true; }
      catch { return false; }
    },
    patch: async (path, data) => {
      try { await fetch(`${FB_URL}/${path}.json`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }); return true; }
      catch { return false; }
    }
  };

  // Local store for session data only (auth, ui state)
  const STORE = {
    get: (k) => { try { return JSON.parse(localStorage.getItem('dp_' + k)); } catch { return null; } },
    set: (k, v) => localStorage.setItem('dp_' + k, JSON.stringify(v)),
    del: (k) => localStorage.removeItem('dp_' + k)
  };

  const AUTH = {
    PASSWORD: 'joefigureditout',
    ADMIN_PASSWORD: 'mikeetheforeverDM.0508',
    check: () => STORE.get('auth') === true,
    checkAdmin: () => STORE.get('adminAuth') === true,
    login: (pw) => {
      if (pw === AUTH.ADMIN_PASSWORD) { STORE.set('auth', true); STORE.set('adminAuth', true); return 'admin'; }
      if (pw === AUTH.PASSWORD) { STORE.set('auth', true); STORE.del('adminAuth'); return 'player'; }
      return false;
    },
    logout: () => { STORE.del('auth'); STORE.del('adminAuth'); }
  };

  const DICE = {
    roll: (sides) => Math.floor(Math.random() * sides) + 1,
    rollN: (n, sides) => Array.from({length: n}, () => DICE.roll(sides)),
    rollSum: (n, sides) => DICE.rollN(n, sides).reduce((a,b) => a+b, 0),
    modifier: (score) => Math.floor((score - 10) / 2),
    modStr: (score) => { const m = DICE.modifier(score); return (m >= 0 ? '+' : '') + m; },
    advantage: (sides) => Math.max(DICE.roll(sides), DICE.roll(sides)),
    disadvantage: (sides) => Math.min(DICE.roll(sides), DICE.roll(sides)),
  };

  const D5E = {
    proficiencyBonus: (level) => Math.ceil(level / 4) + 1,
    xpThresholds: {
      1:{easy:25,medium:50,hard:75,deadly:100},2:{easy:50,medium:100,hard:150,deadly:200},
      3:{easy:75,medium:150,hard:225,deadly:400},4:{easy:125,medium:250,hard:375,deadly:500},
      5:{easy:250,medium:500,hard:750,deadly:1100},6:{easy:300,medium:600,hard:900,deadly:1400},
      7:{easy:350,medium:750,hard:1100,deadly:1700},8:{easy:450,medium:900,hard:1400,deadly:2100},
      9:{easy:550,medium:1100,hard:1600,deadly:2400},10:{easy:600,medium:1200,hard:1900,deadly:2800},
      11:{easy:800,medium:1600,hard:2400,deadly:3600},12:{easy:1000,medium:2000,hard:3000,deadly:4500},
      13:{easy:1100,medium:2200,hard:3400,deadly:5100},14:{easy:1250,medium:2500,hard:3800,deadly:5700},
      15:{easy:1400,medium:2800,hard:4300,deadly:6400},16:{easy:1600,medium:3200,hard:4800,deadly:7200},
      17:{easy:2000,medium:3900,hard:5900,deadly:8800},18:{easy:2100,medium:4200,hard:6300,deadly:9500},
      19:{easy:2400,medium:4900,hard:7300,deadly:10900},20:{easy:2800,medium:5700,hard:8500,deadly:12700},
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
    skillAbility: {Acrobatics:'Dexterity',Athletics:'Strength','Animal Handling':'Wisdom',Arcana:'Intelligence',Deception:'Charisma',History:'Intelligence',Insight:'Wisdom',Intimidation:'Charisma',Investigation:'Intelligence',Medicine:'Wisdom',Nature:'Intelligence',Perception:'Wisdom',Performance:'Charisma',Persuasion:'Charisma',Religion:'Intelligence','Sleight of Hand':'Dexterity',Stealth:'Dexterity',Survival:'Wisdom'},
    conditions: ['Blinded','Charmed','Deafened','Exhaustion','Frightened','Grappled','Incapacitated','Invisible','Paralyzed','Petrified','Poisoned','Prone','Restrained','Stunned','Unconscious'],
    getEncounterXP: (players, avgLevel) => {
      const thresh = D5E.xpThresholds[Math.min(avgLevel, 20)];
      const diff = ['easy','medium','hard','deadly'][DICE.roll(4)-1];
      return { xp: thresh[diff] * (players.length || 1), difficulty: diff };
    },
  };

  const D1E = {
    classes: ['Fighter','Magic-User','Cleric','Thief','Ranger','Paladin','Druid','Illusionist','Assassin','Monk'],
    races: ['Human','Elf','Dwarf','Halfling','Half-Elf','Half-Orc','Gnome'],
    alignments: ['Lawful Good','Lawful Neutral','Lawful Evil','Neutral Good','True Neutral','Neutral Evil','Chaotic Good','Chaotic Neutral','Chaotic Evil'],
    abilityScores: ['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'],
    abilityAbbr: {Strength:'STR',Dexterity:'DEX',Constitution:'CON',Intelligence:'INT',Wisdom:'WIS',Charisma:'CHA'},
    skills: ['Hear Noise','Climb Walls','Pick Pockets','Find/Remove Traps','Open Locks','Move Silently','Hide in Shadows','Read Languages'],
    savingThrows: ['Paralyzation/Poison','Petrification/Polymorph','Rod/Staff/Wand','Breath Weapon','Spells'],
    hitDice: {Fighter:'d10',Ranger:'d8',Paladin:'d10',Cleric:'d8',Druid:'d6','Magic-User':'d4',Illusionist:'d4',Thief:'d6',Assassin:'d6',Monk:'d4'},
    thac0: (level, cls) => {
      const f = ['Fighter','Ranger','Paladin'];
      const c = ['Cleric','Druid','Monk'];
      if (f.includes(cls)) return Math.max(1, 20 - level);
      if (c.includes(cls)) return Math.max(2, 20 - Math.floor(level * 0.667));
      return Math.max(3, 20 - Math.floor(level * 0.5));
    },
    proficiencyBonus: () => 0, // not used in 1e
  };

  const DEFAULT_MONSTERS = [
    {id:'m001',name:"Goblin",cr:"1/4",hp:7,ac:15,attack:"+4",damage:"1d6+2",xp:50,type:"humanoid",size:"Small"},
    {id:'m002',name:"Kobold",cr:"1/8",hp:5,ac:12,attack:"+4",damage:"1d4+2",xp:25,type:"humanoid",size:"Small"},
    {id:'m003',name:"Skeleton",cr:"1/4",hp:13,ac:13,attack:"+4",damage:"1d6+2",xp:50,type:"undead",size:"Medium"},
    {id:'m004',name:"Zombie",cr:"1/4",hp:22,ac:8,attack:"+3",damage:"1d6+1",xp:50,type:"undead",size:"Medium"},
    {id:'m005',name:"Giant Rat",cr:"1/8",hp:7,ac:12,attack:"+4",damage:"1d4+2",xp:25,type:"beast",size:"Small"},
    {id:'m006',name:"Wolf",cr:"1/4",hp:11,ac:13,attack:"+4",damage:"2d4+2",xp:50,type:"beast",size:"Medium"},
    {id:'m007',name:"Orc",cr:"1/2",hp:15,ac:13,attack:"+5",damage:"1d12+3",xp:100,type:"humanoid",size:"Medium"},
    {id:'m008',name:"Hobgoblin",cr:"1/2",hp:11,ac:18,attack:"+3",damage:"1d8+1",xp:100,type:"humanoid",size:"Medium"},
    {id:'m009',name:"Bugbear",cr:"1",hp:27,ac:16,attack:"+4",damage:"2d8+2",xp:200,type:"humanoid",size:"Medium"},
    {id:'m010',name:"Cultist",cr:"1/8",hp:9,ac:12,attack:"+3",damage:"1d6+1",xp:25,type:"humanoid",size:"Medium"},
    {id:'m011',name:"Cult Fanatic",cr:"2",hp:33,ac:13,attack:"+4",damage:"2d6+2",xp:450,type:"humanoid",size:"Medium"},
    {id:'m012',name:"Gnoll",cr:"1/2",hp:22,ac:15,attack:"+4",damage:"2d6+2",xp:100,type:"humanoid",size:"Medium"},
    {id:'m013',name:"Shadow",cr:"1/2",hp:16,ac:12,attack:"+4",damage:"2d6+2",xp:100,type:"undead",size:"Medium"},
    {id:'m014',name:"Specter",cr:"1",hp:22,ac:12,attack:"+4",damage:"3d6",xp:200,type:"undead",size:"Medium"},
    {id:'m015',name:"Ghoul",cr:"1",hp:22,ac:12,attack:"+2",damage:"2d6+2",xp:200,type:"undead",size:"Medium"},
    {id:'m016',name:"Wight",cr:"3",hp:45,ac:14,attack:"+4",damage:"1d6+2",xp:700,type:"undead",size:"Medium"},
    {id:'m017',name:"Banshee",cr:"4",hp:58,ac:12,attack:"+4",damage:"3d6+3",xp:1100,type:"undead",size:"Medium"},
    {id:'m018',name:"Werewolf",cr:"3",hp:58,ac:11,attack:"+4",damage:"2d6+3",xp:700,type:"humanoid",size:"Medium"},
    {id:'m019',name:"Troll",cr:"5",hp:84,ac:15,attack:"+7",damage:"2d6+4",xp:1800,type:"giant",size:"Large"},
    {id:'m020',name:"Ogre",cr:"2",hp:59,ac:11,attack:"+6",damage:"2d8+4",xp:450,type:"giant",size:"Large"},
    {id:'m021',name:"Stone Golem",cr:"10",hp:178,ac:17,attack:"+10",damage:"3d10+6",xp:5900,type:"construct",size:"Large"},
    {id:'m022',name:"Mimic",cr:"2",hp:58,ac:12,attack:"+5",damage:"1d8+3",xp:450,type:"monstrosity",size:"Medium"},
    {id:'m023',name:"Gelatinous Cube",cr:"2",hp:84,ac:6,attack:"+4",damage:"3d6",xp:450,type:"ooze",size:"Large"},
    {id:'m024',name:"Owlbear",cr:"3",hp:59,ac:13,attack:"+7",damage:"2d8+5",xp:700,type:"monstrosity",size:"Large"},
    {id:'m025',name:"Basilisk",cr:"3",hp:52,ac:15,attack:"+5",damage:"2d6+3",xp:700,type:"monstrosity",size:"Medium"},
    {id:'m026',name:"Medusa",cr:"6",hp:127,ac:15,attack:"+5",damage:"1d6+3",xp:2300,type:"monstrosity",size:"Medium"},
    {id:'m027',name:"Mind Flayer",cr:"7",hp:71,ac:15,attack:"+7",damage:"2d10+4",xp:2900,type:"aberration",size:"Medium"},
    {id:'m028',name:"Beholder",cr:"13",hp:180,ac:18,attack:"+9",damage:"4d10",xp:10000,type:"aberration",size:"Large"},
    {id:'m029',name:"Dragon (Young Red)",cr:"10",hp:178,ac:18,attack:"+10",damage:"2d10+6",xp:5900,type:"dragon",size:"Large"},
    {id:'m030',name:"Lich",cr:"21",hp:135,ac:17,attack:"+12",damage:"4d8+5",xp:33000,type:"undead",size:"Medium"},
    {id:'m031',name:"Vampire",cr:"13",hp:144,ac:16,attack:"+9",damage:"1d8+4",xp:10000,type:"undead",size:"Medium"},
    {id:'m032',name:"Flesh Golem",cr:"5",hp:93,ac:9,attack:"+7",damage:"2d8+4",xp:1800,type:"construct",size:"Large"},
    {id:'m033',name:"Drow",cr:"1/4",hp:13,ac:15,attack:"+4",damage:"1d6+2",xp:50,type:"humanoid",size:"Medium"},
    {id:'m034',name:"Yuan-ti Pureblood",cr:"1",hp:40,ac:11,attack:"+3",damage:"2d6+1",xp:200,type:"humanoid",size:"Medium"},
  ];

  const DEFAULT_ROOMS = [
    {id:'r001',name:'The Crypt of Whispers',type:'combat',description:'Crumbling stone walls weep moisture as ancient sarcophagi line the chamber. The air reeks of rot.',flavor:'As you enter, the temperature drops sharply. The torchlight flickers.',exits:['north','east'],minLevel:1,maxLevel:5},
    {id:'r002',name:'The Hall of Riddles',type:'puzzle',description:'Three stone doors line the far wall, each inscribed with a symbol: a flame, a wave, and a skull.',flavor:'Your footsteps echo strangely here.',puzzle:{question:'I speak without a mouth and hear without ears. I have no body but come alive with wind. What am I?',answer:'echo',hint:'Think about how sound behaves in empty spaces.',successLoot:true,failureTrap:{damage:'2d6',type:'fire',save:'DEX DC 13'}},exits:['north','south'],minLevel:1,maxLevel:10},
    {id:'r003',name:'The Treasure Vault',type:'treasure',description:'Gold glimmers in the torchlight. Chests, urns, and scattered coins fill this chamber.',flavor:'Someone has been here recently. Fresh boot prints in the dust.',exits:['south'],minLevel:2,maxLevel:20},
    {id:'r004',name:'The Collapsed Corridor',type:'exploration',description:'Rubble chokes this passage. A narrow gap near the ceiling might allow a small creature through.',flavor:'The sound of dripping water echoes from somewhere beyond the debris.',exits:['east','west'],minLevel:1,maxLevel:20},
    {id:'r005',name:'The Sacrificial Altar',type:'combat',description:'Dark stains mar the surface of an obsidian altar. Cultist robes hang from iron pegs.',flavor:'The symbol carved into the altar is unmistakable — someone still uses this place.',exits:['north','south','west'],minLevel:3,maxLevel:10},
    {id:'r006',name:'The Flooded Chamber',type:'exploration',description:'Three feet of dark water fills the floor. Something long and pale moves near the far wall.',flavor:'The water is unnaturally cold.',exits:['east','west'],minLevel:1,maxLevel:8},
    {id:'r007',name:'The Library of Lost Tomes',type:'puzzle',description:'Bookshelves tower to the ceiling. A central lectern holds an open book that shifts when you look away.',flavor:'The room smells of old paper and something sweet.',puzzle:{question:'The more you take, the more you leave behind. What am I?',answer:'footsteps',hint:'Think about what you leave in your wake as you travel.',successLoot:true,failureTrap:{damage:'3d6',type:'psychic',save:'INT DC 15'}},exits:['south','east'],minLevel:3,maxLevel:15},
    {id:'r008',name:'The Barracks of the Damned',type:'combat',description:'Rows of moldering cots line this room. The undead soldiers who once slept here now stand at grim attention.',flavor:'Their eyes are empty but their weapons are not.',exits:['north','east'],minLevel:2,maxLevel:12},
    {id:'r009',name:"The Alchemist's Laboratory",type:'treasure',description:'Glass vessels bubble and smoke. Shelves of ingredients line the walls. The alchemist is gone.',flavor:'A journal lies open: "Day 47. The formula is complete. God help me."',exits:['west','south'],minLevel:3,maxLevel:20},
    {id:'r010',name:'The Throne Room',type:'boss',description:'A massive throne of iron and bone dominates the far wall. The creature that sits upon it has been waiting.',flavor:"The temperature here is wrong. The thing on the throne smiles — it knew when you entered.",exits:['south'],minLevel:5,maxLevel:20},
    {id:'r011',name:'The Mirror Hall',type:'puzzle',description:'Seven mirrors line the walls, each showing a slightly different reflection. One shows you dead.',flavor:'As you approach your reflection, it moves half a second after you do.',puzzle:{question:'I have cities but no houses. Mountains but no trees. Water but no fish. What am I?',answer:'map',hint:"It represents something real but isn't real itself.",successLoot:false,failureTrap:{damage:'2d8',type:'cold',save:'CON DC 14'}},exits:['north','south'],minLevel:4,maxLevel:20},
    {id:'r012',name:'The Mushroom Grove',type:'exploration',description:'Giant fungi fill this cavern, their caps glowing a sickly blue-green.',flavor:'The spores in the air are thick. You can feel them on your tongue, sweet and numbing.',exits:['north','east','west'],minLevel:1,maxLevel:6},
    {id:'r013',name:"The Warden's Office",type:'treasure',description:'A desk of heavy stone sits in the corner, its drawers locked. Keys hang on iron hooks.',flavor:'Wanted posters cover the walls. One looks like a party member.',exits:['north','west'],minLevel:2,maxLevel:20},
    {id:'r014',name:'The Summoning Circle',type:'combat',description:'A perfect circle of salt and ash fills the floor. Candles burn with black flames.',flavor:'The air smells of sulfur. Something has already been summoned.',exits:['south','east'],minLevel:5,maxLevel:20},
    {id:'r015',name:"The Beggar's Den",type:'social',description:"A haggard figure looks up with hollow eyes. 'Spare a copper? I know things.'",flavor:"They wear tattered noble's clothing. They've been here a long time.",exits:['north','east','west','south'],minLevel:1,maxLevel:20},
  ];

  const LOOT = {
    common: ['Copper coins (2d10 cp)','Silver coins (1d6 sp)','Torch','Rope (50ft)','Rations (1d4 days)','Candle','Chalk','Flint and steel'],
    uncommon: ['Gold coins (2d10 gp)','Potion of Healing',"Thieves' tools","Healer's kit",'Lantern','Antitoxin','Silver dagger'],
    rare: ['Gold coins (10d10 gp)','Potion of Greater Healing','+1 Arrow (5)','Spell Scroll (level 1)','Gem (50 gp)'],
    veryRare: ['+1 Weapon','+1 Armor','Ring of Protection','Cloak of Elvenkind','Boots of Speed'],
    legendary: ['+2 Weapon','+2 Armor','Ring of Regeneration','Vorpal Sword','Holy Avenger'],
    getLootByLevel: (level) => {
      const roll = DICE.roll(100);
      if (level <= 4) {
        if (roll <= 60) return LOOT.common[DICE.roll(LOOT.common.length)-1];
        if (roll <= 90) return LOOT.uncommon[DICE.roll(LOOT.uncommon.length)-1];
        return LOOT.rare[DICE.roll(LOOT.rare.length)-1];
      } else if (level <= 10) {
        if (roll <= 40) return LOOT.uncommon[DICE.roll(LOOT.uncommon.length)-1];
        if (roll <= 80) return LOOT.rare[DICE.roll(LOOT.rare.length)-1];
        return LOOT.veryRare[DICE.roll(LOOT.veryRare.length)-1];
      } else {
        if (roll <= 40) return LOOT.rare[DICE.roll(LOOT.rare.length)-1];
        if (roll <= 75) return LOOT.veryRare[DICE.roll(LOOT.veryRare.length)-1];
        return LOOT.legendary[DICE.roll(LOOT.legendary.length)-1];
      }
    }
  };

  // ---- FIREBASE CHARACTER CRUD ----
  const getCharacters = async () => {
    const data = await FB.get('characters');
    if (!data) return [];
    return Object.entries(data).map(([k,v]) => ({...v, _fbKey: k}));
  };
  const saveCharacter = async (char) => {
    const { _fbKey, ...data } = char;
    if (_fbKey) { await FB.set(`characters/${_fbKey}`, data); return char; }
    const result = await FB.push('characters', data);
    return { ...data, _fbKey: result?.name };
  };
  const deleteCharacter = async (fbKey) => FB.del(`characters/${fbKey}`);

  // ---- FIREBASE ROOM CRUD ----
  const getCustomRooms = async () => {
    const data = await FB.get('rooms');
    if (!data) return [];
    return Object.entries(data).map(([k,v]) => ({...v, _fbKey: k, isCustom: true}));
  };
  const saveCustomRoom = async (room) => {
    const { _fbKey, ...data } = room;
    if (_fbKey) { await FB.set(`rooms/${_fbKey}`, data); return room; }
    const result = await FB.push('rooms', data);
    return { ...data, _fbKey: result?.name, isCustom: true };
  };
  const deleteCustomRoom = async (fbKey) => FB.del(`rooms/${fbKey}`);
  const getAllRooms = async () => {
    const custom = await getCustomRooms();
    return [...DEFAULT_ROOMS, ...custom];
  };

  // ---- FIREBASE MONSTER CRUD ----
  const getCustomMonsters = async () => {
    const data = await FB.get('monsters');
    if (!data) return [];
    return Object.entries(data).map(([k,v]) => ({...v, _fbKey: k, isCustom: true}));
  };
  const saveCustomMonster = async (monster) => {
    const { _fbKey, ...data } = monster;
    if (_fbKey) { await FB.set(`monsters/${_fbKey}`, data); return monster; }
    const result = await FB.push('monsters', data);
    return { ...data, _fbKey: result?.name, isCustom: true };
  };
  const deleteCustomMonster = async (fbKey) => FB.del(`monsters/${fbKey}`);
  const getAllMonsters = async () => {
    const custom = await getCustomMonsters();
    return [...DEFAULT_MONSTERS, ...custom];
  };

  // ---- GAME STATE (Firebase) ----
  const getDefaultState = () => ({
    started: false, players: [], currentRoom: null,
    visitedRooms: [], mapRooms: [], turn: 0,
    log: [], loot: [], totalXP: 0,
    completed: false, allDead: false,
    dungeonLevel: 1, edition: '5e'
  });
  const getState = async () => (await FB.get('gameState')) || getDefaultState();
  const setState = async (s) => FB.set('gameState', s);
  const resetState = async () => FB.set('gameState', getDefaultState());

  // ---- ADMIN SETTINGS ----
  const getAdminSettings = async () => (await FB.get('adminSettings')) || { edition: '5e', dmMode: false };
  const setAdminSettings = async (s) => FB.set('adminSettings', s);

  // ---- MAP GENERATION ----
  const generateMap = async (players, dungeonLevel) => {
    const allRooms = await getAllRooms();
    const eligible = allRooms.filter(r => r.minLevel <= dungeonLevel && r.maxLevel >= dungeonLevel);
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(12, shuffled.length));
    if (!selected.some(r => r.type === 'boss')) {
      const bossRoom = allRooms.find(r => r.type === 'boss');
      if (bossRoom) selected[selected.length - 1] = bossRoom;
    }
    const mapRooms = selected.map((room, i) => ({
      ...room, visited: i === 0, isStart: i === 0,
      isBoss: room.type === 'boss', connections: [], cleared: false,
    }));
    for (let i = 1; i < mapRooms.length; i++) {
      const from = DICE.roll(Math.max(1, i)) - 1;
      if (!mapRooms[from].connections.includes(i)) mapRooms[from].connections.push(i);
      if (!mapRooms[i].connections.includes(from)) mapRooms[i].connections.push(from);
    }
    return mapRooms;
  };

  // ---- ENCOUNTER GENERATION ----
  const generateEncounter = async (players, dungeonLevel) => {
    const avgLevel = players.length > 0
      ? Math.round(players.reduce((s,p) => s+(p.level||1),0) / players.length)
      : dungeonLevel;
    const allMonsters = await getAllMonsters();
    const { xp, difficulty } = D5E.getEncounterXP(players, avgLevel);
    const sorted = [...allMonsters].sort((a,b) => Math.abs(a.xp - xp) - Math.abs(b.xp - xp));
    const base = sorted[0];
    const num = Math.max(1, Math.min(8, Math.round(xp / base.xp)));
    const hpMult = 0.8 + (avgLevel / 20) * 0.4;
    const monsters = Array.from({length: num}, (_, i) => ({
      ...base, id: `m_${i}_${Date.now()}`,
      currentHP: Math.max(1, Math.round(base.hp * hpMult)),
      maxHP: Math.max(1, Math.round(base.hp * hpMult)),
      initiative: DICE.roll(20) + DICE.modifier(10),
    }));
    return { monsters, difficulty, xpReward: Math.round(xp / (players.length || 1)) };
  };

  const addLog = (state, message, type='info') => {
    state.log = [{ text: message, type, turn: state.turn, time: new Date().toLocaleTimeString() }, ...(state.log||[])].slice(0, 100);
  };

  // Simple PIN hash
  const hashPin = (pin) => {
    let h = 5381;
    for (let i = 0; i < pin.length; i++) h = ((h << 5) + h) ^ pin.charCodeAt(i);
    return 'ph' + Math.abs(h >>> 0).toString(36);
  };

  return {
    FB, STORE, AUTH, DICE, D5E, D1E, LOOT,
    DEFAULT_ROOMS, DEFAULT_MONSTERS,
    getState, setState, resetState, getDefaultState,
    getCharacters, saveCharacter, deleteCharacter,
    getCustomRooms, saveCustomRoom, deleteCustomRoom, getAllRooms,
    getCustomMonsters, saveCustomMonster, deleteCustomMonster, getAllMonsters,
    generateMap, generateEncounter, addLog,
    getAdminSettings, setAdminSettings,
    hashPin,
  };
})();

window.DungeonEngine = DungeonEngine;
