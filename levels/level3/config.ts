
export const LEVEL3_CONFIG = {
  TILE_SIZE: 64, // Размер одного игрового блока
  COLS: 17,
  ROWS: 11,
  MOVE_SPEED: 4,
  PLAYER_WIDTH: 40,
  PLAYER_HEIGHT: 50,
  COLORS: {
    // Пол ресторана (Скорректирован: темнее текущего, но светлее оригинала)
    ARENA_BG: '#292524',       // Stone-800
    ARENA_GRID_LIGHT: 'rgba(255, 255, 255, 0.08)', 
    ARENA_GRID_DARK: '#3f3939', // Между Stone-700 и Stone-800
    
    // Внешние стены (Темное благородное дерево)
    WALL_TOP_LIGHT: '#5d4037', 
    WALL_TOP_DARK: '#271c19',  
    WALL_SIDE: '#1a120b',      
    
    WALL_ACCENT: '#dc2626',    
    RIVET: '#d97706',          

    // Shoji Screen (Soft Block)
    SHOJI_FRAME: '#451a03',    
    SHOJI_PAPER: '#d6d3d1',    
    SHOJI_PAPER_SHADOW: '#a8a29e', 
    
    // Doors
    DOOR_ENTRY: '#ef4444', 
    DOOR_EXIT: '#16a34a',  
    DOOR_FRAME: '#271c19'
  },
  SUMO_PHRASES: {
    CHASE: [
      'Mitsuketa zo!',
      'Nigasanē!',
      'Temē, tomare!',
      'Shinnyūsha da! Yatchimae!',
      'Kakugo shiro!'
    ],
    STUN: [
      'Gu…!?',
      'Na, nan da ima no!?',
      'Kuso, me ga mawaru…',
      'Uo! Yareta!',
      'Chi… bakuhatsu ka yo…'
    ],
    DIE: [
      'Guwā!!',
      'Ba, bakana…!',
      'Kuso…!',
      'Uwāaaa!',
      '…Chikushō'
    ]
  },
  KATYA_PHRASES: {
    START: [
      'Вера, ну где же ты?'
    ],
    BOMB: [
      'Ну что, время пришло!',
      'Я это тут оставлю',
      'Сейчас будет горячо',
      'Это вам бонус',
      'Бежать – сейчас'
    ],
    STUN: [
      'Перерывчик',
      'Голова кружится?',
      'Тяжеловато вышло?',
      'Посиди'
    ],
    KILL: [
      'Спасибо, было вкусно',
      'Кто следующий?',
      'Убрано',
      'Перебор с весом',
      'Тебе идет взрыв'
    ]
  }
};
