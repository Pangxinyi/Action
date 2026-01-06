import { Plus } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';

interface CategorySelectorProps {
  categories: { [key: string]: string };
  selectedCategory: string | null;
  onSelectCategory: (catName: string | null) => void;
  onCreateCategory: () => void;
  isNewCategory?: boolean; // 新增：控制是否显示新建分类输入框
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  newCategoryColor?: string;
  setNewCategoryColor: (color: string) => void;
  themeColors: readonly string[];
  colors: any;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onCreateCategory,
  isNewCategory = false, // 默认值为 false
  newCategoryName,
  setNewCategoryName,
  newCategoryColor,
  setNewCategoryColor,
  themeColors,
  colors,
}) => {
  const { t } = useTranslation();
  return (
    <View>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', marginBottom: 8 }}>
        {t('projects.category')}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {Object.entries(categories).map(([catName, catColor]) => {
          const isSelected = selectedCategory === catName;
          return (
            <Pressable
              key={catName}
              onPress={() => onSelectCategory(catName)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: isSelected ? catColor : `${catColor}20`,
                borderWidth: 2,
                borderColor: catColor,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: isSelected ? colors.primaryText : catColor }}>{catName}</Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={onCreateCategory}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: isNewCategory ? colors.accentLight : colors.surface, // 修复：使用 isNewCategory
            borderWidth: 1,
            borderColor: isNewCategory ? colors.accent : colors.border, // 修复：使用 isNewCategory
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Plus size={14} color={isNewCategory ? colors.accent : colors.textTertiary} />
          <Text style={{ fontSize: 13, color: isNewCategory ? colors.accent : colors.textTertiary }}>
            {t('projects.newCategory')}
          </Text>
        </Pressable>
      </View>

      {isNewCategory && (
        <View style={{ marginTop: 12, gap: 8 }}>
          <TextInput
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              fontSize: 14,
              color: colors.text,
            }}
            placeholder={t('projects.categoryNamePlaceholder')}
            placeholderTextColor={colors.textQuaternary}
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />

          <Text style={{ fontSize: 12, color: colors.textTertiary, marginLeft: 4 }}>{t('common.color')}</Text>

          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {themeColors.map((color) => (
              <Pressable
                key={color}
                style={[
                  {
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: color,
                  },
                  newCategoryColor === color && {
                    borderColor: colors.primary,
                    borderWidth: 3,
                  },
                ]}
                onPress={() => setNewCategoryColor(color)}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default CategorySelector;