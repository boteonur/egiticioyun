export const ADMIN_EMAILS = ['admin@lockedchecker.com', 'onursahinbt@gmail.com';]

export const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const createInitialBoard = () => {
  const board = Array(2).fill(null).map(() => 
    Array(3).fill(null).map(() => Array(14).fill(0))
  );
  const topCaps = [1, 1, 1];
  const botCaps = [1, 1, 1];

  for (let r = 0; r < 3; r++) {
    for (let step = 0; step < topCaps[r]; step++) {
      board[0][r][6 - step] = 1;
      board[0][r][7 + step] = 1;
    }
    for (let step = 0; step < botCaps[r]; step++) {
      board[1][r][6 - step] = 1;
      board[1][r][7 + step] = 1;
    }
  }
  return board;
};

export const getCellColor = (side, col) => {
  return (side === 0 && col <= 6) || (side === 1 && col >= 7) ? 'blue' : 'red';
};

export const getGenitiveSuffix = (name) => {
  if (!name) return "'nin";
  const nameLower = name.replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase();
  const vowels = "aıeiouöü";
  let lastVowel = "";
  for (let i = nameLower.length - 1; i >= 0; i--) {
    if (vowels.includes(nameLower[i])) {
      lastVowel = nameLower[i];
      break;
    }
  }
  const endsWithVowel = vowels.includes(nameLower[nameLower.length - 1]);
  if (lastVowel === 'a' || lastVowel === 'ı') return endsWithVowel ? "'nın" : "'ın";
  if (lastVowel === 'e' || lastVowel === 'i') return endsWithVowel ? "'nin" : "'in";
  if (lastVowel === 'o' || lastVowel === 'u') return endsWithVowel ? "'nun" : "'un";
  if (lastVowel === 'ö' || lastVowel === 'ü') return endsWithVowel ? "'nün" : "'ün";
  return "'nin";
};
