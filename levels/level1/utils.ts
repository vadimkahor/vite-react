
import React from 'react';

/**
 * Получает следующую случайную фразу из списка, исключая недавние повторы.
 * @param phrases Массив доступных фраз
 * @param historyRef Ссылка на массив истории использованных фраз
 */
export const getNextPhrase = (phrases: string[], historyRef: string[]) => {
  // Фильтруем фразы, которые уже есть в истории
  const available = phrases.filter(p => !historyRef.includes(p));
  
  // Если все фразы были использованы недавно, берем любую из полного списка
  const source = available.length > 0 ? available : phrases;
  
  const phrase = source[Math.floor(Math.random() * source.length)];
  
  // Обновляем историю
  historyRef.push(phrase);
  if (historyRef.length > 2) historyRef.shift(); // Храним только последние 2
  
  return phrase;
};

/**
 * Добавляет всплывающее сообщение в игровой мир.
 */
export const addFloatingMessage = (
  messages: any[], 
  text: string, 
  x: number, 
  y: number
) => {
  messages.push({
    id: Math.random().toString(),
    text,
    x,
    y,
    life: 1.0
  });
};
