// ── BIRDS ─────────────────────────────────────────────────────────────────────

const BIRDS = [
  "Robin","Wren","Finch","Dove","Swan","Crow","Lark","Sparrow","Eagle","Goose",
  "Heron","Crane","Stork","Raven","Bluebird","Hawk","Cardinal","Pigeon","Falcon","Magpie",
  "Pelican","Seagull","Starling","Swallow","Thrush","Warbler","Kingfisher","Woodpecker","Nuthatch","Chickadee",
  "Mockingbird","Bluejay","Oriole","Grosbeak","Sandpiper","Plover","Cormorant","Egret","Ibis","Flamingo",
  "Osprey","Kestrel","Merlin","Harrier","Buzzard","Vulture","Condor","Albatross","Petrel","Gannet",
  "Puffin","Tern","Avocet","Curlew","Dunlin","Godwit","Redshank","Turnstone","Pheasant","Partridge",
  "Grouse","Quail","Turkey","Peacock","Macaw","Cockatoo","Parakeet","Lorikeet","Cockatiel","Toucan",
  "Hornbill","Kingbird","Flycatcher","Vireo","Tanager","Bunting","Siskin","Redpoll","Crossbill","Dipper",
  "Treecreeper","Firecrest","Stonechat","Wheatear","Whinchat","Nightjar","Nightingale","Hoopoe","Roller","Bee-eater",
  "Sunbird","Lyrebird","Cassowary","Kookaburra","Bowerbird","Frigatebird","Roadrunner","Quetzal","Birdofparadise","Shoebill"
];

const BIRD_EMOJIS = [
  "🐦","🐦","🐦","🕊️","🦢","🐦‍⬛","🐦","🐦","🦅","🪿",
  "🦤","🦢","🪶","🐦‍⬛","🐦","🦅","🐦","🐦","🦅","🐦",
  "🦩","🐦","🐦","🐦","🐦","🐦","🐦","🐦","🐦","🐦",
  "🐦","🐦","🐦","🐦","🐦","🐦","🐦","🦤","🦩","🦩",
  "🦅","🦅","🦅","🦅","🐦","🦅","🦅","🐦","🐦","🐦",
  "🐧","🐦","🦤","🐦","🐦","🐦","🐦","🐦","🐦","🐦",
  "🐦","🐦","🦃","🦚","🦜","🦜","🦜","🦜","🦜","🐦",
  "🐦","🐦","🐦","🐦","🐦","🐦","🐦","🐦","🐦","🐦",
  "🐦","🐦","🐦","🐦","🐦","🐦","🎵","🐦","🐦","🐦",
  "🐦","🐦","🐦","🐦","🐦","🐦","🐦","🐦","🦜","🐦"
];

// All bird names as a set for quick lookup (normalised)
const BIRD_SET = new Set(BIRDS.map(b => b.toLowerCase().replace(/[^a-z]/g, '')));

// ── LETTER FREQUENCY ──────────────────────────────────────────────────────────
// Weighted pool matching English letter distribution
const LETTER_FREQ = [
  ...'EEEEEEEEE',  // 9
  ...'AAAAAAAA',   // 8
  ...'IIIIIII',    // 7
  ...'OOOOOOO',    // 7
  ...'NNNNNN',     // 6
  ...'TTTTTT',     // 6
  ...'RRRRRR',     // 6
  ...'SSSSS',      // 5
  ...'LLLLL',      // 5
  ...'CCCC',       // 4
  ...'UUUU',       // 4
  ...'DDDD',       // 4
  ...'MMM',        // 3
  ...'PPP',        // 3
  ...'HHH',        // 3
  ...'GGG',        // 3
  ...'BBB',        // 3
  ...'FFF',        // 3
  ...'YY',         // 2
  ...'WW',         // 2
  ...'KK',         // 2
  ...'VV',         // 2
  ...'X',          // 1
  ...'Q',          // 1
  ...'J',          // 1
  ...'Z',          // 1
];

// ── COMMON WORDS (for hints) ──────────────────────────────────────────────────
const COMMON_WORDS = [
  "able","act","age","air","all","also","alter","among","angel","ankle","answer","ape",
  "apple","apply","arch","area","argue","arm","art","ash","ask","atom","back","bail",
  "bake","ball","band","bank","barn","base","bath","bear","beat","bell","belt","best",
  "bird","bite","black","blade","blank","blast","blend","blue","boat","bold","bond",
  "bone","book","born","both","bowl","brave","bread","break","brick","bright","brook",
  "brown","brush","bulk","bull","bump","burn","bush","busy","cage","cake","calm","camp",
  "card","care","cave","cell","cent","chair","chalk","charm","chase","check","chest",
  "chin","chip","clam","clap","claw","clay","clean","clear","clip","clock","cloud",
  "coat","coin","cold","cone","cook","cool","core","corn","cost","cove","crab","craft",
  "cream","creek","crisp","crop","cross","crown","cube","curl","cute","dark","dart",
  "dash","date","dawn","deal","dean","deep","deer","dense","dial","dirt","disc","dish",
  "dive","dock","dome","door","dose","down","drag","drain","draw","dream","dress",
  "drift","drink","drop","dune","dusk","dust","earn","east","edge","elbow","else",
  "empty","enter","even","event","face","fact","fair","fall","farm","fast","fate",
  "fawn","feel","fell","fern","field","film","find","fire","fish","fist","flag","flame",
  "flat","flea","flip","flock","flow","foam","fold","fond","food","foot","ford","fork",
  "form","fort","frame","free","fresh","frog","frost","full","fund","game","gate",
  "gave","gaze","gear","gift","give","glad","glare","glass","glide","glow","goal",
  "gold","gone","good","gown","grab","grace","grain","grand","grape","grasp","grass",
  "grave","gray","great","green","grim","grip","grit","grow","guard","guide","gulf",
  "gull","gulp","gust","half","hall","hand","hang","hard","hare","harm","harp","have",
  "head","heal","heap","heat","heel","help","herb","herd","here","hide","high","hill",
  "hint","hold","hole","home","hood","hook","hope","horn","hose","host","hour","huge",
  "hull","hunt","hurt","idle","into","iron","island","item","jest","join","joke","jolt",
  "jump","just","keep","kelp","kind","king","kiss","kite","kneel","knife","knit","knot",
  "know","lake","lamb","lamp","land","lane","last","lava","lawn","lead","leaf","lean",
  "leap","left","lens","life","lift","lime","line","link","lion","list","live","load",
  "loam","lock","loft","lone","long","look","loom","loop","loud","love","luck","lull",
  "lump","lung","lure","lush","made","mane","mare","mark","mast","mate","maze","meal",
  "meet","meld","melt","mesh","mild","milk","mill","mind","mine","mint","miss","mist",
  "moat","mode","mole","moon","more","moss","moth","move","much","musk","must","mute",
  "name","neat","neck","need","nest","newt","next","nice","nine","node","nook","noon",
  "norm","nose","note","noun","null","numb","oboe","open","orca","over","oven","pack",
  "pact","page","pain","pale","palm","peak","pear","peat","peel","pelt","pine","pink",
  "pipe","place","plain","plan","plane","plant","plate","play","plot","plug","plum",
  "poem","pole","pond","pool","poor","pore","pork","port","pose","post","pour","press",
  "prey","pride","prime","pull","pump","pure","push","race","rack","raft","rage","rain",
  "rake","ramp","rank","rave","read","real","reap","reef","reel","rest","rich","ride",
  "rift","ring","rise","risk","road","roam","roar","robe","rock","role","roll","roof",
  "rook","room","root","rope","rose","ruin","rule","rump","rune","rush","rust","safe",
  "sage","sail","sake","salt","same","sand","sane","save","seal","seam","seed","seek",
  "seem","seep","self","sell","send","shade","shake","shape","share","shark","sharp",
  "shell","shift","shine","ship","shoe","shop","shore","show","sift","sign","silk",
  "sill","sing","sink","site","size","slab","slam","slap","slate","slim","slip","slot",
  "slow","slug","small","smell","smile","smoke","snap","snare","snow","soak","soap",
  "soar","soft","soil","sold","sole","some","song","soot","sort","soul","soup","sour",
  "space","span","spark","speak","speed","spell","spend","spill","spine","split","spoon",
  "sport","spot","spray","spring","stab","stag","stain","stall","stamp","stand","stare",
  "stay","stem","step","stern","stew","stick","still","sting","stir","stock","stone",
  "stop","store","storm","strip","study","stuff","stump","such","suit","sulk","sure",
  "surf","swim","swing","tale","tall","tame","tang","task","teal","team","tear","tell",
  "tend","tent","term","test","thick","thin","thorn","three","throw","tide","tile",
  "till","tilt","time","tiny","tire","toad","toil","told","toll","tomb","tone","tool",
  "torn","toss","tour","town","trace","track","trade","trail","trap","tray","tree",
  "trek","trim","trip","trot","truck","true","trunk","trust","tube","tuck","tune",
  "turf","turn","tusk","twig","twin","twist","vale","vane","vast","veal","veil","vein",
  "vent","verb","vest","view","vine","void","vote","wade","wail","wake","walk","wall",
  "wand","ward","warm","wave","wean","weed","week","weld","well","went","west","wide",
  "will","wilt","wind","wine","wing","wink","wire","wish","wisp","wolf","wood","wool",
  "word","work","worm","wrap","wren","write","yard","yarn","yawn","year","yell","yelp",
  "yoke","zeal","zero","zest","zone","zoom"
];
