import { COLOR_THEMES } from '../constants/theme';
import type { CategoryMap } from '../types';

export const getDefaultCategories = (language: string): CategoryMap => {
  if (language === 'zh') {
    return {
      '工作': COLOR_THEMES.default[0],
      '学习': COLOR_THEMES.default[1],
      '运动': COLOR_THEMES.default[2],
    };
  }
  return {
    'Work': COLOR_THEMES.default[0],
    'Learning': COLOR_THEMES.default[1],
    'Fitness': COLOR_THEMES.default[2],
  };
};